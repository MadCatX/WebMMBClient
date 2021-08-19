/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Compound, ResidueNumber } from '../model/compound';
import { ungzip } from '../zip/unzip';
import { parseCif } from './cif';
import { parsePdb } from './pdb';

const CompoundIdsToSingle = new Map([
    ['GLY', 'G'], ['PRO', 'P'], ['ALA', 'A'],
    ['VAL', 'V'], ['LEU', 'L'], ['ILE', 'I'],
    ['MET', 'M'], ['CYS', 'C'], ['PHE', 'F'],
    ['TYR', 'Y'], ['TRP', 'W'], ['HIS', 'H'],
    ['LYS', 'K'], ['ARG', 'R'], ['GLN', 'Q'],
    ['ASN', 'N'], ['GLU', 'E'], ['ASP', 'D'],
    ['SER', 'S'], ['THR', 'T'],
    ['G', 'G'], ['P', 'P'], ['A', 'A'],
    ['V', 'V'], ['L', 'L'], ['I', 'I'],
    ['M', 'M'], ['C', 'C'], ['F', 'F'],
    ['Y', 'Y'], ['W', 'W'], ['H', 'H'],
    ['K', 'K'], ['R', 'R'],	['Q', 'Q'],
    ['N', 'N'], ['E', 'E'], ['D', 'D'],
    ['S', 'S'], ['T', 'T'],
    ['U', 'U'],
    ['DA', 'A'], ['DC', 'C'], ['DG', 'G'], ['DT', 'T'],
]);

export namespace Structural {
    export type Chain = { authName: string, residues: Residue[] };
    export type Residue = { compound: string, no: number, authNo: number, seqNo: number };
    export type Chains = Map<string, Chain>;

    async function dataToChains(data: string | File, type: string) {
        switch (type) {
        case 'cif':
            return await cifToChains(data);
        case 'pdb':
            return await pdbToChains(data);
        }
        throw new Error(`Unknown structure file type ${type}`);
    }

    function decideType(possible: Compound.PossibleTypes, considerNA: boolean) {
        if (possible.protein) {
            if (considerNA) {
                if (possible.dna)
                    return 'DNA';
                if (possible.rna)
                    return 'RNA';
            }
            return 'protein';
        } else if (possible.dna) {
            return 'DNA';
        } else if (possible.rna) {
            return 'RNA';
        }
        throw new Error('Cannot decide compound type');
    }

    function getSuffix(fileName: string): { head: string, suffix: string } {
        const idx = fileName.lastIndexOf('.');
        if (idx < 0)
            return { head: fileName, suffix: '' };
        const suffix = fileName.slice(idx + 1).toLowerCase();
        return { head: fileName.slice(0, idx), suffix };
    }

    export async function cifToChains(cif: string | File): Promise<Chains> {
        if (typeof cif !== 'string')
            return parseCif(await cif.text());
        return parseCif(cif);
    }

    export function chainsToCompounds(chains: Chains) {
        const compounds: Compound[] = [];
        for (const [k, v] of chains.entries()) {
            let seq = '';
            const residues: ResidueNumber[] = [];
            let considerNA = true;
            for (const res of v.residues) {
                considerNA = res.compound.length < 3;
                const single = CompoundIdsToSingle.get(res.compound);
                if (!single) {
                    console.warn(`No known conversion of compoound ${res.compound} to single letter code. Skipping residue ${k}, ${res.no}.`);
                    continue;
                }

                seq += single;
                residues.push({ number: res.no, authNumber: res.authNo });
            }
            if (seq.length === 0) {
                console.warn(`Chain ${k} contains empty sequence. Skipping.`);
                continue;
            }
            const possible = Compound.guessCompoundType(seq);
            if (!possible.dna && !possible.rna && !possible.protein) {
                console.warn(`Chain ${k} contains a biomolecule of undetectable type. Skipping.`);
                continue;
            }
            const type = decideType(possible, considerNA);

            const ch = { name: k, authName: v.authName };
            compounds.push(new Compound(type, ch, Compound.stringToSequence(seq, type), residues));
        }

        return compounds;
    }

    export async function extractChainsFromStructureFile(file: File): Promise<Chains> {
        let { head, suffix } = getSuffix(file.name);
        const isGZipped = suffix === 'gz';
        if (isGZipped) {
            ({ head, suffix } = getSuffix(head));
            const compressed = new Uint8Array(await file.arrayBuffer());
            const decompressed = await ungzip(compressed);
            const text = new TextDecoder().decode(decompressed);
            return await dataToChains(text, suffix);
        }
        return await dataToChains(file, suffix);
    }

    export async function pdbToChains(pdb: string | File): Promise<Chains> {
        if (typeof pdb !== 'string')
            return parsePdb(await pdb.text());
        return parsePdb(pdb);
    }
}
