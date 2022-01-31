/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

const DNAIdentifiers = [ 'A', 'T', 'G', 'C' ];
const ProteinIdentifiers = [ 'G', 'P', 'A', 'V', 'L', 'I', 'M', 'C', 'F', 'Y', 'W', 'H', 'K', 'R', 'Q', 'N', 'E', 'D', 'S', 'T' ];
const RNAIdentifiers = [ 'A', 'U', 'G', 'C' ];

export interface ResidueNumber {
    number: number;
    authNumber: number;
}

export class Chain implements Comparable, Cloneable {
    readonly name: string;
    readonly authName: string;

    constructor(name: string, authName?: string) {
        if (name.length !== 1)
            throw new Error('Chain name must be a single character');

        this.name = name;
        this.authName = authName ? authName : name;
    }

    clone() {
        return new Chain(this.name, this.authName);
    }

    equals(other: Chain) {
        return this.name === other.name && this.authName === other.authName;
    }
}

interface Comparator<T> {
    (first: T, second: T): boolean;
}

function cmpArr<T>(first: T[], second: T[], comparator?: Comparator<T>) {
    if (first.length !== second.length)
        return false;

    const cmpFunc = comparator ? comparator : (first: T, second: T) => first === second;
    for (let idx = 0; idx < first.length; idx++) {
        if (!cmpFunc(first[idx], second[idx]))
            return false;
    }
    return true;
}

export class Compound implements Comparable, Cloneable {
    readonly residues: ResidueNumber[];

    constructor(readonly type: Compound.Type, readonly chain: Chain, readonly sequence: Compound.AnyResidue[], residues: ResidueNumber[]|number) {
        if (sequence.length < 1)
            throw new Error('Sequence is empty');

        switch (type) {
        case 'DNA':
            if (!Compound.isDna(sequence))
                throw new Error('Sequence is not DNA');
            break;
        case 'protein':
            if (!Compound.isProtein(sequence))
                throw new Error('Sequence is not protein');
            break;
        case 'RNA':
            if (!Compound.isRna(sequence))
                throw new Error('Sequence is not RNA');
            break;
        }

        if (typeof residues === 'object') {
            if (residues.length !== sequence.length)
                throw new Error('Length of residue numbering array does not match the length of sequence');
            this.residues = residues;
        } else if (typeof residues === 'number') {
            this.residues = [];
            for (let idx = 0; idx < sequence.length; idx++) {
                this.residues.push({ number: idx + 1, authNumber: idx + residues });
            }
        } else
            throw new Error('Bad residues type');
    }

    clone() {
        const residues = this.residues.map(r => ({ number: r.number, authNumber: r.authNumber }));
        return new Compound(this.type, this.chain.clone(), [...this.sequence], residues);
    }

    equals(other: Compound) {
        return this.chain.name === other.chain.name && this.chain.authName === this.chain.authName &&
               cmpArr(this.residues, other.residues, (a: ResidueNumber, b: ResidueNumber) => a.number === b.number && a.authNumber === b.authNumber) &&
               this.type === other.type &&
               cmpArr(this.sequence, other.sequence);
    }

    get firstResidue() {
        return this.residues[0];
    }

    get lastResidue() {
        return this.residues[this.residues.length - 1];
    }

    residueByNumber(num: number) {
        return this.residues[num - 1];
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

    export function stringIsSequence(input: string, type: Compound.Type) {
        const checker = (() => {
            switch (type) {
            case 'DNA': return isDnaResidue;
            case 'RNA': return isRnaResidue;
            case 'protein': return isProteinResidue;
            }
        })();
        for (const c of input) {
            if (!checker(c))
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
