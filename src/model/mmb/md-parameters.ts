/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

export class MdParameters implements Comparable, Cloneable {
    constructor(public useDefaults: boolean) {
    }

    clone() {
        return new MdParameters(this.useDefaults);
    }

    equals(other: MdParameters) {
        return Comparable.compareProps(other, this);
    }

    static readonly Defaults = {
        useDefaults: true,
    }
}
