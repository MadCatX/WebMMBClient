/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */


export class ResidueSpan {
    constructor(public readonly first: number, public readonly last: number) {
        if (this.last < this.first)
            throw new Error('Last is lower than first');
    }

    public overlap(other: ResidueSpan) {
        if (this.first < other.first) {
            return this.last >= other.first;
        } else {
            return other.last >= this.first;
        }
    }

    equals(other: ResidueSpan) {
        return this.first === other.first && this.last === other.last;
    }
}

export class Mobilizer {
    constructor(public readonly bondMobility: Mobilizer.BondMobility,
                public readonly chain?: string,
                public readonly residueSpan?: ResidueSpan) {
    }

    equals(other: Mobilizer) {
        return this.bondMobility === other.bondMobility &&
               this.chain === other.chain &&
               this.residueSpan === other.residueSpan;
    }
}

export namespace Mobilizer {
    export type BondMobility = 'Rigid' | 'Torsion' | 'Free';

    export function isBondMobility(v: string): v is BondMobility {
        return v === 'Rigid' || v === 'Torsion' || v === 'Free';
    }
}
