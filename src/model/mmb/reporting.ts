/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

export class Reporting implements Comparable, Cloneable {
    constructor(public interval: number, public count: number) {
    }

    clone() {
        return new Reporting(this.interval, this.count);
    }

    equals(other: Reporting) {
        return Comparable.compareProps(other, this);
    }

    static readonly Defaults = {
        interval: 3,
        count: 5,
    }
}
