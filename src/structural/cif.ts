/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

/* BEWARE, BEWARE, the code below is terrible */

import { Structural } from './';

type mmCifCategory = Record<string, (string|null)[]>;
type mmCif = Record<string, mmCifCategory>;

const AtomSites = {
    group_PDB: [],
    label_asym_id: [],
    label_seq_id: [],
    auth_asym_id: [],
    auth_seq_id: []
};
type AtomSites = typeof AtomSites;

function isAtomSites(obj: unknown): obj is AtomSites {
    if (typeof obj !== 'object')
        return false;

    console.log(obj);

    for (const k in AtomSites) {
        const key = k as keyof AtomSites;
        if ((obj as AtomSites)[key] === undefined)
            return false;
        if (typeof (obj as AtomSites)[key] !== typeof AtomSites[key])
            return false;
    }
    return true;
}

function _ln(data: string): { idx: number, line: string } {
    const idx = data.indexOf('\n');
    if (idx < 0)
        return { idx: -1, line: '' };
    return { idx, line: data.slice(0, idx) };
}

function _lnt(data: string): { idx: number, line: string } {
    const l = _ln(data);
    return { idx: l.idx, line: l.line.trim() };
}

function checkQuoted(s: string) {
    if (s.length < 2)
        return { isQuoted: false, quoteChar: '' };
    const ch = s[0];
    return {
        isQuoted: ch === '\'' || ch === '"',
        quoteChar: ch
    };
}

function replaceEvery(s: string, what: string, by: string) {
    let idx = s.indexOf(what);
    while(idx >= 0) {
        s = s.replace(what, by);
        idx = s.indexOf(what);
    }
    return s;
}

function parseLoopBody(data: string, headers: string[]): { category: mmCifCategory, tail: string } {
    let category: mmCifCategory = {};

    for (const h of headers)
        category[h] = [];

    while (data.length > 0) {
        let { idx, line } = _lnt(data);
        if (idx < 0)
            throw new Error('mmCif fle unexpectedly ended in the middle of a loop body');

        if (line === '#')
            return { category, tail: data.slice(idx + 1) };

        let content: string[] = [];

        while (content.length < headers.length) {
            if (data.length < 1)
                throw new Error('mmCif file unexpectedly ended in the middle of a loop body');

            if (line.length < 1) {
                data = data.slice(idx + 1);
                ({ idx, line } = _lnt(data));
            } else if (line[0] === ';') {
                const kdx = data.slice(1).search(/^;\n/gm);
                if (kdx < 0)
                    throw new Error('Multiline entry without terminating semicolon');
                const mline = data.slice(1, kdx);
                content.push(replaceEvery(mline, '\n', ''));
                data = data.slice(kdx + 2); // +2 because we need to skip the newline too
                ({ idx, line } = _lnt(data));
            } else {
                while (line.length > 0) {
                    const { isQuoted, quoteChar } = checkQuoted(line);
                    const isBlockEnd = isQuoted ? (ch: string) => ch === quoteChar : (ch: string) => ch === ' ' || ch === '\t';
                    let block = '';

                    let jdx = 0 + (isQuoted ? 1 : 0);
                    while (jdx < line.length && !isBlockEnd(line[jdx]))
                        block += line[jdx++];

                    if (jdx === line.length && isQuoted && line[jdx - 1] !== '\'') {
                        console.log(line);
                        throw new Error('Unterminated quoted block');
                    }

                    content.push(block);
                    line = line.slice(jdx + 1).trimLeft();
                }

                data = data.slice(idx + 1);
                ({ idx, line } = _lnt(data));
            }
        }

        for (let cdx = 0; cdx < headers.length; cdx++) {
            const c = content[cdx];
            if (c === undefined)
                throw new Error('Undefined entry, this should never happen');
            else if (c === '?' || c === '.')
                category[headers[cdx]].push(null);
            else
                category[headers[cdx]].push(content[cdx]);
        }
    }

    throw new Error('mmCif file ended unexpectedly in the middle of a loop body');
}

function parseLoopHeader(data: string): { categoryName: string, headers: string[], tail: string } {
    let categoryName = '';
    let headers: string[] = [];

    while (data.length > 0) {
        let { idx, line } = _lnt(data);
        if (idx < 0)
            throw new Error('mmCif file ended unexpectedly in the middle of a loop header');
        if (line.length < 1)
            throw new Error('Zero line length in loop header');
        if (line[0] === ';')
            throw new Error('Multiline entry sign in loop header is not handled');
        if (line[0] !== '_')
            return { tail: data, categoryName, headers };

        const segs = line.split('.');
        if (segs.length !== 2)
            throw new Error('Loop header has invalid format');

        let [ cat, header ] = segs;
        cat = cat.slice(1);

        if (categoryName === '')
            categoryName = cat;
        else if (categoryName !== cat)
            throw new Error('Multiple categories in one loop are not allowed');

        if (headers.includes(header))
            throw new Error('Duplicit header name');

        headers.push(header);

        data = data.slice(idx + 1);
    }

    throw new Error('mmCif file ended unexpectedly in the moddle of a loop header');
}

function toMmCif(data: string) {
    let cif: mmCif = {};

    while (data.length > 0) {
        const { idx, line } = _ln(data);
        if (idx < 0)
            return cif;

        if (line === 'loop_') {
            data = data.slice(idx + 1);
            let { tail, headers, categoryName } = parseLoopHeader(data);
            let category; ({ tail, category } = parseLoopBody(tail, headers));
            cif[categoryName] = category;
            data = tail;
        } else
            data = data.slice(idx + 1);
    }

    return cif;
}

function extractStructuralDivision(cif: mmCif): Structural.Division {
    if (!cif['atom_site'])
        throw new Error('atom_site catogory not found. Unable to extract structural division data');

    const chains = new Map<string, number[]>();
    const authChains = new Map<string, number[]>();

    const atomSites = cif['atom_site'];
    if (!isAtomSites(atomSites))
        throw new Error('atom_site object has a wrong type');
    const len = atomSites.group_PDB.length;
    for (let idx = 0; idx < len; idx++) {
        const chain = atomSites.label_asym_id[idx];
        const residue = atomSites.label_seq_id[idx];
        const authChain = atomSites.auth_asym_id[idx];
        const authResidue = atomSites.auth_seq_id[idx];

        if (chain === null || residue === null)
            continue;

        if (!chains.has(chain))
            chains.set(chain, new Array<number>())

        let resNo = parseInt(residue);
        if (isNaN(resNo))
            throw new Error(`Non-numeric value of residue number ${residue}`);
        if (!chains.get(chain)!.includes(resNo))
            chains.get(chain)!.push(resNo);

        if (authChain !== null) {
            if (!authChains.has(authChain))
                authChains.set(authChain, new Array<number>());
        }
        if (authResidue !== null) {
            resNo = parseInt(authResidue);
            if (isNaN(resNo))
                throw new Error(`Non-numeric author residue number value ${authResidue}`);
            if (!authChains.get(authChain)!.includes(resNo))
                authChains.get(authChain)!.push(resNo);
        }
    }

    return { chains, authChains };
}

export function parseCif(data: string): Structural.Division {
    const cif = toMmCif(data);
    return extractStructuralDivision(cif);
}
