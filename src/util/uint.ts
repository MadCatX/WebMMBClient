/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export namespace Uint {
    function toUint32(n: number, littleEndian: boolean) {
        const buf = new Uint8Array(4);
        const dw = new DataView(buf.buffer);

        const v = n >>> 0;
        dw.setUint32(0, v, littleEndian);
        return buf;
    }

    export function toUint32Le(n: number) {
        return toUint32(n, true);
    }

    export function toUint32Be(n: number) {
        return toUint32(n, false);
    }
}
