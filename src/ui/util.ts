/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

const ZeroChar = '0'.charCodeAt(0);
const NineChar = '9'.charCodeAt(0);

function HasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop);
}

export namespace UiUtil {
    export function parseFloatStrict(obj: unknown) {
        if (typeof obj === 'number')
            return obj;
        if (typeof obj !== 'string')
            return NaN;

        const s = obj.trim().replace(',', '.');

        let decSepCnt = 0;
        for (let idx = 0; idx < s.length; idx++) {
            if (s.charAt(idx) == '.') {
                decSepCnt++;
                if (decSepCnt > 1)
                    return NaN;
                continue;
            }

            const code = s.charCodeAt(idx);
            if (code < ZeroChar || code > NineChar)
                return NaN;
        }

        return parseFloat(s);
    }

    export function parseIntStrict(obj: unknown) {
        if (typeof obj === 'number')
            return obj;
        if (typeof obj !== 'string')
            return NaN;

        const s = obj.trim();

        for (let idx = 0; idx < s.length; idx++) {
            const code = s.charCodeAt(idx);
            if (code < ZeroChar || code > NineChar)
                return NaN;
        }

        return parseInt(s);
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
}
