/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

const ZeroChar = '0'.charCodeAt(0);
const NineChar = '9'.charCodeAt(0);
const MinusChar = '-';

export namespace Num {
    export function isNum(obj?: unknown): obj is number {
        if (obj === undefined)
            return false;
        if (typeof obj === 'number')
            return !isNaN(obj);
        return false;
    }

    export function parseFloatStrict(obj: unknown) {
        if (typeof obj === 'number')
            return obj;
        if (typeof obj !== 'string')
            return NaN;

        if (obj.length < 1)
            return NaN;

        const s = obj.trim().replace(',', '.');

        let decSepCnt = 0;
        let idx = 0;
        if (s[0] === MinusChar)
            idx++;
        for (; idx < s.length; idx++) {
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

        let idx = 0;
        if (s[0] === MinusChar)
            idx++;
        for (; idx < s.length; idx++) {
            const code = s.charCodeAt(idx);
            if (code < ZeroChar || code > NineChar)
                return NaN;
        }

        return parseInt(s);
    }
}
