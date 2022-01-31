/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export type AnyObject = Record<string, unknown>;
export type Dearray<T> = T extends (infer U)[] ? U : never;
export type EmptyObject = Record<never, unknown>;
export type MaybeDearray<T> = T extends (infer U)[] ? U : T;

export class Eraseable<T> {
    private _v: T | undefined;
    private _erased: boolean;

    private constructor(v: T | undefined, erased: boolean) {
        this._v = v;
        this._erased = erased;
    }

    asStr() {
        return `${this._v}`;
    }

    get erased() {
        return this._erased;
    }

    get() {
        if (this._v === undefined)
            throw new Error('No value');
        return this._v;
    }

    static Erased<T>() {
        return new Eraseable<T>(void 0, true);
    }

    static Set<T>(v: T) {
        return new Eraseable<T>(v, false);
    }
}
