/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

function HasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop);
}

export namespace UiUtil {
    export function toString(value: any) {
        if (value === undefined)
            return '';
        if (typeof value === 'string')
            return value;
        if (typeof value === 'number')
            return value.toString();
        if (typeof value === 'object' && HasOwnProperty(value, 'toString') && typeof value.toString === 'function')
            return value.toString();
        return '';
    }
}
