/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

function chainsOverlap(firstX: number, lastX: number, firstY: number, lastY: number) {
    if (firstX <= firstY) {
        if (lastX >= firstY)
            return true;
    } else {
        if (firstX <= lastY)
            return true;
    }
    return false;
}

export class DoubleHelix implements Comparable, Cloneable {
    constructor(public chainNameA: string, public firstResNoA: number, public lastResNoA: number,
                public chainNameB: string, public firstResNoB: number, public lastResNoB: number) {
    }

    clone() {
        return new DoubleHelix(
            this.chainNameA, this.firstResNoA, this.lastResNoA,
            this.chainNameB, this.firstResNoB, this.lastResNoB
        );
    }

    equals(other: DoubleHelix) {
        return this.chainNameA === other.chainNameA &&
               this.firstResNoA === other.firstResNoA &&
               this.lastResNoA === other.lastResNoA &&
               this.chainNameB === other.chainNameB &&
               this.firstResNoB === other.firstResNoB &&
               this.lastResNoB === other.lastResNoB;
    }

    overlaps(other: DoubleHelix) {
        /* Mind the fact that residues on chain B are counted backwards! */
        if (other.chainNameA === this.chainNameA) {
            if (chainsOverlap(other.firstResNoA, other.lastResNoA, this.firstResNoA, this.lastResNoA))
                return true;
        }
        if (other.chainNameA === this.chainNameB) {
            if (chainsOverlap(other.firstResNoA, other.lastResNoA, this.lastResNoB, this.firstResNoB)) // The backwards thing!
                return true;
        }
        if (other.chainNameB === this.chainNameA) {
            if (chainsOverlap(other.lastResNoB, other.firstResNoB, this.firstResNoA, this.lastResNoA)) // The backwards thing!
                return true;
        }
        if (other.chainNameB === this.chainNameB) {
            if (chainsOverlap(other.lastResNoB, other.firstResNoB, this.lastResNoB, this.firstResNoB)) // The backwards thing twice!
                return true;
        }
        return false;
    }

    toString() {
        return `${this.chainNameA} [${this.firstResNoA} -> ${this.lastResNoA}] <-> ${this.chainNameB} [${this.firstResNoB} <- ${this.lastResNoB}]`;
    }
}
