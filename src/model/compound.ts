/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

const ResidueIdentifiers = [ 'A', 'T', 'U', 'G', 'C' ];

export class Compound {
    readonly residueCount: number;
    readonly lastResidueNo: number;

    constructor(readonly chain: string, readonly firstResidueNo: number, readonly type: Compound.Type, readonly sequence: Compound.Residue[]) {
        this.residueCount = sequence.length;
        this.lastResidueNo = this.firstResidueNo + this.residueCount - 1;

        switch (type) {
        case 'DNA':
            if (!Compound.isDna(sequence))
                throw new Error('Sequence is not DNA');
            break;
        case 'RNA':
            if (!Compound.isRna(sequence))
                throw new Error('Sequence is not RNA');
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
    export type Residue = typeof ResidueIdentifiers[number];
    export type Type = 'DNA' | 'RNA';

    export function isDna(sequence: Residue[]) {
        return sequence.find((e) => e === 'U') === undefined;
    }

    export function isResidue(id: string): id is Residue {
        return ResidueIdentifiers.includes(id as Residue);
    }

    export function isResidues(input: string) {
        for (const c of input) {
            if (!isResidue(c))
                return false;
        }
        return true;
    }

    export function isRna(sequence: Residue[]) {
        return sequence.find((e) => e === 'T') === undefined;
    }

    export function sequenceAsString(residues: Residue[]) {
        return residues.reduce((r, s) => r + s, '');
    }

    export function stringToSequence(input: string) {
        const residues: Residue[] = [];

        for (const c of input) {
            if (!isResidue(c))
                throw new Error(`Symbol ${c} does not indentify a valid residue`);
            residues.push(c);
        }

        return residues;
    }
}
