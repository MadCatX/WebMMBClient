/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Num } from './num';

export type AnyObject = Record<string, unknown>;

export interface TypeChecker<V> {
    (v: unknown): v is V;
}

export function assign<T, K extends keyof T>(dst: T, src: AnyObject, prop: K): T {
    dst[prop] = (src as T)[prop];
    return dst;
}

export function assignAll<T>(dst: AnyObject, src: AnyObject, template: T): T {
    for (const prop in template)
        dst = assign(dst as T, src, prop) as AnyObject;

    return dst as T;
}

export function checkProps<T>(checked: AnyObject, template: T) {
    for (const prop in template) {
        if (!checked.hasOwnProperty(prop))
            throw new Error(`No property ${prop} on object`);
    }
}

export function checkType<V, T, K extends keyof T>(obj: T, prop: K, checker: TypeChecker<V>) {
    if (!checker(obj[prop] as unknown))
        throw new Error(`Property ${prop} has a wrong type`);
}

export function isArr<T>(obj: unknown, chk: TypeChecker<T>): obj is T[] {
    if (Array.isArray(obj) === false)
        return false;

    for (const elem of obj as unknown[]) {
        if (chk(elem) === false)
            return false;
    }

    return true;
}

export function isBool(obj: unknown): obj is boolean {
    return typeof obj === 'boolean';
}

export function isInt(obj: unknown): obj is number {
    if (typeof obj === 'number')
        return Number.isInteger(obj);
    if (typeof obj === 'string')
        return !isNaN(Num.parseIntStrict(obj));
    return false;
}

export function isNum(obj: unknown): obj is number {
    if (typeof obj === 'number')
        return Number.isFinite(obj);
    if (typeof obj === 'string')
        return !isNaN(Num.parseFloatStrict(obj));
    return false;
}

export function isObj(obj: unknown): obj is AnyObject {
    return typeof obj === 'object' &&
                  obj !== null &&
                  !Array.isArray(obj);
}

export function isStr(obj: unknown): obj is string {
    return typeof obj === 'string';
}