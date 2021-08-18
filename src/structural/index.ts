/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Compound, ResidueNumber } from '../model/compound';
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
    ['U', 'U']
]);

export namespace Structural {
    export type Chain = { authName: string, residues: Residue[] };
    export type Residue = { compound: string, no: number, authNo: number, seqNo: number };
    export type Chains = Map<string, Chain>;

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

    export async function cifToChains(cif: string | File): Promise<Chains> {
        let data = '';
        if (typeof cif !== 'string')
            data = await cif.text();

        return parseCif(data);
    }

    export function chainsToCompounds(chains: Chains) {
        const compounds: Compound[] = [];
        for (const [k, v] of chains.entries()) {
            let seq = '';
            const residues: ResidueNumber[] = [];
            let considerNA = true;
            for (const res of v.residues) {
                considerNA = res.compound.length === 1;
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

    export async function pdbToChains(pdb: string | File): Promise<Chains> {
        let data = '';
        if (typeof pdb !== 'string')
            data = await pdb.text();

        return parsePdb(data);
    }
}
