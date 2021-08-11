/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

const DNAIdentifiers = [ 'A', 'T', 'G', 'C' ];
const ProteinIdentifiers = ['G', 'P', 'A', 'V', 'L', 'I', 'M', 'C', 'F', 'Y', 'W', 'H', 'K', 'R', 'Q', 'N', 'E', 'D', 'S', 'T' ];
const RNAIdentifiers = [ 'A', 'U', 'G', 'C' ];

export class Compound {
    readonly residueCount: number;
    readonly lastResidueNo: number;

    constructor(readonly chain: string, readonly firstResidueNo: number, readonly type: Compound.Type, readonly sequence: Compound.AnyResidue[]) {
        this.residueCount = sequence.length;
        this.lastResidueNo = this.firstResidueNo + this.residueCount - 1;

        switch (type) {
        case 'DNA':
            if (!Compound.isDna(sequence))
                throw new Error('Sequence is not DNA');
            break;
        case 'protein':
            if (!Compound.isProtein(sequence))
                throw new Error('Sequence is not DNA');
            break;
        case 'RNA':
            if (!Compound.isRna(sequence))
                throw new Error('Sequence is not RNA');
            break;
        }
    }

    equals(other: Compound) {
        return this.chain === other.chain &&
               this.firstResidueNo === other.firstResidueNo &&
               this.type === other.type &&
               this.sequence === other.sequence;
    }
}

export namespace Compound {
    export type DNAResidue = typeof DNAIdentifiers[number];
    export type ProteinResidue = typeof ProteinIdentifiers[number];
    export type RNAResidue = typeof RNAIdentifiers[number];
    export type AnyResidue = DNAResidue | ProteinResidue | RNAResidue;
    export type Type = 'DNA' | 'RNA' | 'protein';
    export type PossibleTypes = { dna: boolean, protein: boolean, rna: boolean };

    export function guessCompoundType(input: string): PossibleTypes {
        let maybeDNA = true;
        let maybeRNA = true;
        let maybeProtein = true;

        for (const c of input) {
            maybeDNA = maybeDNA && isDnaResidue(c);
            maybeRNA = maybeRNA && isRnaResidue(c);
            maybeProtein = maybeProtein && isProteinResidue(c);
        }

        return {
            dna: maybeDNA,
            protein: maybeProtein,
            rna: maybeRNA,
        };
    }

    export function isDna(sequence: AnyResidue[]) {
        for (const c of sequence) {
            if (!isDnaResidue(c))
                return false;
        }
        return true;
    }

    export function isDnaResidue(id: string): id is DNAResidue {
        return DNAIdentifiers.includes(id);
    }

    export function isProteinResidue(id: string): id is ProteinResidue {
        return ProteinIdentifiers.includes(id);
    }

    export function isRnaResidue(id: string): id is DNAResidue {
        return RNAIdentifiers.includes(id);
    }

    export function isResidue(id: string, type: Type): id is AnyResidue {
        switch (type) {
        case 'DNA':
            return isDnaResidue(id);
        case 'protein':
            return isProteinResidue(id);
        case 'RNA':
            return isRnaResidue(id);
        }
    }

    export function isProtein(sequence: AnyResidue[]) {
        for (const c of sequence) {
            if (!ProteinIdentifiers.includes(c))
                return false;
        }
        return true;
    }

    export function isRna(sequence: AnyResidue[]) {
        for (const c of sequence) {
            if (!RNAIdentifiers.includes(c))
                return false;
        }
        return true;
    }

    export function isType(s: string): s is Type {
        return s === 'DNA' || s === 'RNA' || s === 'protein';
    }

    export function sequenceAsString(residues: AnyResidue[]) {
        return residues.reduce((r, s) => r + s, '');
    }

    export function stringIsSequence(input: string) {
        for (const c of input) {
            const isRes = isDnaResidue(c) || isProteinResidue(c) || isRnaResidue(c);
            if (!isRes)
                return false;
        }
        return true;
    }

    export function stringToSequence(input: string, type: Type) {
        const residues: AnyResidue[] = [];

        for (const c of input) {
            if (!isResidue(c, type))
                throw new Error(`Symbol ${c} does not indentify a valid residue for ${type} sequence`);
            residues.push(c);
        }

        return residues;
    }
}
