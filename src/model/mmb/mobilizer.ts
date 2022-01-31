/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

export class ResidueSpan implements Comparable, Cloneable {
    constructor(public readonly first: number, public readonly last: number) {
    }

    clone() {
        return new ResidueSpan(this.first, this.last);
    }

    equals(other: ResidueSpan) {
        return this.first === other.first && this.last === other.last;
    }

    overlaps(other: ResidueSpan) {
        if (this.first < other.first) {
            return this.last >= other.first;
        } else {
            return other.last >= this.first;
        }
    }
}

export class Mobilizer implements Comparable, Cloneable {
    constructor(public bondMobility: Mobilizer.BondMobility,
                public chainName?: string,
                public residueSpan?: ResidueSpan) {
        if (!chainName && residueSpan)
            throw new Error('Setting residueSpan without chainName is not allowed');
    }

    clone() {
        return new Mobilizer(
            this.bondMobility,
            this.chainName,
            this.residueSpan ? this.residueSpan.clone() : void 0
        );
    }

    equals(other: Mobilizer) {
        return this.bondMobility === other.bondMobility &&
               this.chainName === other.chainName &&
               this.residueSpan === other.residueSpan;
    }

    overlaps(other: Mobilizer) {
        if (!other.chainName && !this.chainName)
            return true;

        if (other.chainName === this.chainName) {
            if (!other.residueSpan || !this.residueSpan)
                return true;
            return this.residueSpan.overlaps(other.residueSpan);
        }
    }

    toString() {
        let str = this.bondMobility;
        if (!this.chainName)
            return str + ' (all chains)';
        str += ` ${this.chainName}`;
        if (!this.residueSpan)
            return str + ' (entire chain)';
        return str + ` ${this.residueSpan.first} ->  ${this.residueSpan.last}`;
    }
}

export namespace Mobilizer {
    export type BondMobility = 'Rigid' | 'Torsion' | 'Free';

    export function isBondMobility(v: string): v is BondMobility {
        return v === 'Rigid' || v === 'Torsion' || v === 'Free';
    }
}
