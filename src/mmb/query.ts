/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Request } from './request';
import { Response } from './response';
import { Net } from '../util/net';

export namespace Query {
    export interface QueryPerformer<T> {
        (): Promise<T|null>;
    }

    export interface Query<T> {
        aborter: AbortController;
        performer: QueryPerformer<T>;
    }

    export interface QueryFunc {
        (): Request.Pending;
    }

    export class ResponseError {
        readonly name = 'ResponseError';

        constructor(public readonly status: number, public readonly message: string, private readonly prefix?: string) {
        }

        toString() {
            if (this.prefix)
                return `${this.prefix}: ${formatReqError(this.message, this.status)}`;
            else
                return formatReqError(this.message, this.status);
        }
    }

    function formatReqError(message: string, httpStatus: number) {
        return `${httpStatus} - ${message}`
    }

    export function isResponseError(v: object): v is ResponseError {
        return v.hasOwnProperty('name') && (v as ResponseError).name === 'ResponseError';
    }

    async function handleReq<T extends Response>(promise: Promise<T>, aborter: AbortController): Promise<{ status: number, json: Record<string, unknown> }> {
        const resp = await promise;

        try {
            const json = await resp.json();

            if (Net.isFetchAborted(aborter)) {
                const err = new Error();
                err.name = 'AbortError';

                throw err;
            }

            return { status: resp.status, json };
        } catch (e) {
            if (resp.ok)
                throw new Error('Server replied with OK status but we could not parse the response');
            else
                throw new Error(`${resp.status} - Invalid request`);
        }
    }

    function handleResp<T>(json: Record<string, unknown>, parser: Response.DataParser<T>, status: number, errorPrefix?: string) {
        const r = Response.parse(json, parser);
        if (Response.isError(r))
            throw new ResponseError(status, r.message, errorPrefix);
        if (!Response.isOk(r))
            throw new Error('Unexpected response payload type');

        return r.data;
    }

    export function query<T>(queryFunc: QueryFunc, respParser: Response.DataParser<T>, errorPrefix?: string) {
        const pending = queryFunc();
        const performer = async () => {
            try {
                const { status, json } = await handleReq(pending.promise, pending.aborter);
                return handleResp(json, respParser, status, errorPrefix);
            } catch (e) {
                if (Net.isAbortError(e as Error))
                    return null;
                else
                    throw e;
            }
        };

        return { aborter: pending.aborter, performer };
    }
}
