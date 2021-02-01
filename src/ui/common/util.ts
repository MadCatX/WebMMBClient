/**
 * Copyright (c) 2020-2021 WebMMB 2020-2021 contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

function HasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop);
}

export namespace Util {
    export function formatError(status: number|undefined, prefix: string, text: string) {
        if (status === 403)
            return `${prefix} - ${status}: You session may have expired. Try logging in again.`;

        const st = status ? `${status}: ${prefix} - ` : `${prefix} - `;
        return `${st} ${text}`;
    }

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

    export function nToS(v?: number) {
        if (v === undefined)
            return '';
        return v.toString();
    }
}
