/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { BaseResponse, BaseResponseObj, ErrorResponse, ErrorResponseObj, OkResponse } from './api';
import { AnyObject } from '../util/types';

export namespace Response {
    export interface DataParser<T> {
        (obj: unknown): T,
    }

    export interface Payload<T> {
        isOk: boolean;
    }

    export class Error<T> implements Payload<T> {
        readonly isOk = false;

        constructor(readonly message: string) {
        }
    }

    export class Ok<T> implements Payload<T> {
        readonly isOk = true;

        constructor(readonly data: T) {
        }
    }

    function parseError<T>(obj: AnyObject) {
        for (const prop in ErrorResponseObj) {
            if (!obj.hasOwnProperty(prop))
                throw new Error(`No property "${prop}" in ErrorResponse object`);
        }

        const error = (obj as ErrorResponse).message;
        if (typeof error !== 'string')
            throw new Error('Type of error message is not a string');
        return new Error<T>(error);
    }

    function parseOk<T>(obj: AnyObject, parser: DataParser<T>) {
        if (!obj.hasOwnProperty('data'))
            throw new Error('No property data in OkResponse object');

        return new Ok<T>(parser((obj as OkResponse<T>).data));
    }

    export function parse<T>(obj: AnyObject, parser: DataParser<T>) {
        for (const prop in BaseResponseObj) {
            if (!obj.hasOwnProperty(prop))
                throw new Error(`No property ${prop} in Response object`);
        }

        if ((obj as BaseResponse).success) {
            return parseOk(obj, parser);
        } else {
            return parseError(obj);
        }
    }

    export function isError<T>(payload: Payload<T>): payload is Error<T> {
        return !payload.isOk;
    }

    export function isOk<T>(payload: Payload<T>): payload is Ok<T> {
        return payload.isOk;
    }
}