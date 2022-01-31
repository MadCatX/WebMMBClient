/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

export class StagesSpan implements Comparable, Cloneable {
    constructor(public first: number, public last: number) {
    }

    clone() {
        return new StagesSpan(this.first, this.last);
    }

    equals(other: StagesSpan) {
        return Comparable.compareProps(other, this);
    }
}
