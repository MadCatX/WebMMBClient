/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

export class GlobalConfig implements Comparable, Cloneable {
    constructor(
        public baseInteractionScaleFactor: number,
        public temperature: number,
    ) {
    }

    clone() {
        return new GlobalConfig(
            this.baseInteractionScaleFactor,
            this.temperature,
        );
    }

    equals(other: GlobalConfig) {
        return Comparable.compareProps(other, this);
    }

    static default() {
        return new GlobalConfig(
            this.Defaults.baseInteractionScaleFactor,
            this.Defaults.temperature,
        );
    }

    static readonly Defaults = {
        baseInteractionScaleFactor: 200,
        temperature: 10,
    }
}
