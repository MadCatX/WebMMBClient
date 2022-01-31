/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Comparable } from '../../util/comparable';
import { Cloneable } from '../../util/cloneable';
import { EdgeInteraction } from './edge-interaction';
import { Orientation } from './orientation';

export class BaseInteraction implements Comparable, Cloneable {
    constructor(
        public chainNameA: string, public resNoA: number, public edgeA: EdgeInteraction.Edge,
        public chainNameB: string, public resNoB: number, public edgeB: EdgeInteraction.Edge,
        public orientation: Orientation.Orientation
    ) {
    }

    clone() {
        return new BaseInteraction(
            this.chainNameA, this.resNoA, this.edgeA,
            this.chainNameB, this.resNoB, this.edgeB,
            this.orientation
        );
    }

    equals(other: BaseInteraction) {
        return this.chainNameA === other.chainNameA &&
               this.resNoA === other.resNoA &&
               this.edgeA === other.edgeA &&
               this.chainNameB === other.chainNameB &&
               this.resNoB === other.resNoB &&
               this.edgeB === other.edgeB &&
               this.orientation === other.orientation;
    }
}
