/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export class GlobalConfig {
    constructor(readonly baseInteractionScaleFactor: number,
                readonly temperature: number) {
        if (this.baseInteractionScaleFactor <= 0)
            throw new Error('Invalid baseInteractionScaleFactor');
    }

    static readonly Defaults = {
        baseInteractionScaleFactor: 200,
        temperature: 10,
    }
}
