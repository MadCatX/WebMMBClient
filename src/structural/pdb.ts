/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Structural } from './';
type AtomEntry = {
    label_asym_id: string,
    label_comp_id: string,
    label_seq_id: number
};

function _ln(data: string): { line: string, tail: string } {
    let idx = data.indexOf('\n');
    if (idx < 0)
        return { line: data, tail: '' };
    else {
        const line = data.slice(0, idx);
        const tail = data.slice(idx + 1);
        return { line, tail };
    }
}

function atomEntriesToChains(entries: AtomEntry[]) {
    const chains: Structural.Chains = new Map<string, Structural.Chain>();

    for (let idx = 0; idx < entries.length; idx++) {
        const e = entries[idx];

        if (!chains.has(e.label_asym_id))
            chains.set(e.label_asym_id, { authName: e.label_asym_id, residues: [] });

        let resNo = chains.get(e.label_asym_id)!.residues.length + 1;
        if (!chains.get(e.label_asym_id)!.residues.find(r => r.seqNo === e.label_seq_id)) {
            chains.get(e.label_asym_id)!.residues.push({ compound: e.label_comp_id, no: resNo, authNo: e.label_seq_id, seqNo: e.label_seq_id });
        }
    }

    return chains;
}

function parseLine(line: string) : AtomEntry | null {
    if (line.slice(0, 4) !== 'ATOM')
        return null;
    if (line.length < 78) {
        console.warn('PDB ATOM line is less than 78 characters long');
        return null;
    }

    const label_comp_id = line.slice(17, 20).trim();
    const label_asym_id = line.slice(21, 22);
    const label_seq_id = parseInt(line.slice(22, 26));
    if (isNaN(label_seq_id)) {
        console.warn('Residue identifier is not a number');
        return null;
    }

    return { label_asym_id, label_comp_id, label_seq_id };
}

export function parsePdb(data: string): Structural.Chains {
    const entries: AtomEntry[] = [];
    let { line, tail } = _ln(data);
    while (tail.length > 0) {
        const e = parseLine(line);
        if (e)
            entries.push(e);
        ({ line, tail } = _ln(tail));
    }

    return atomEntriesToChains(entries);
}
