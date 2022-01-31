/*
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export interface Comparable {
    equals(other: Comparable): boolean;
}

export namespace Comparable {
    export function compareProps<T extends object>(a: T, b: T) {
        for (const p in a) {
            if (typeof a[p] === 'function')
                continue;
            if (a[p] !== b[p])
                return false;
        }
        return true;
    }
}
