/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export namespace Manip {
    type Subtype<T, U> = T extends U ? Partial<T> : never;

    export function assign<T, U>(first: Partial<T>, second: Subtype<T, U>): Partial<T> {
        return { ...first, ...second };
    }

    export function hasDefined<T>(obj: T) {
        for (const p in obj) {
            if (p !== undefined)
                return true;
        }
        return false;
    }
}
