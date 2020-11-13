/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export class StagesSpan {
    constructor(readonly first: number, readonly last: number) {
        if (first < 1)
            throw new Error('Invalid first stage value');
        if (last < first)
            throw new Error('Invalid last stage value');
    }
}
