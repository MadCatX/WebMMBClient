/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export class Reporting {
    constructor(readonly interval: number, readonly count: number) {
        if (interval <= 0)
            throw new Error('Invalid reporting interval');
        if (count < 1)
            throw new Error('Invalid report count');
    }

    static readonly Defaults = {
        interval: 3,
        count: 5,
    }
}
