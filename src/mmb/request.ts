/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { ApiRequest, AuthRequest, TransferChunk } from './api';

export namespace Request {
    export interface Pending {
        promise: Promise<Response>;
        aborter: AbortController;
    }

    export function api<T>(req: ApiRequest<T>): Pending {
        const aborter = new AbortController();
        const promise = fetch(
            '/api',
            {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'error',
                body: JSON.stringify(req),
                signal: aborter.signal,
            },
        );

        return { promise, aborter };
    }

    export function auth(req: AuthRequest): Pending {
        const aborter = new AbortController();
        const promise = fetch(
            '/auth',
            {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'error',
                body: JSON.stringify(req),
                signal: aborter.signal,
            },
        );

        return { promise, aborter };
    }

    export function xfr(req: TransferChunk): Pending {
        const payload = new Uint8Array([...req.job_id, ...req.transfer_id, ...req.data]);

        const aborter = new AbortController();
        const promise = fetch(
            '/xfr',
            {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
                redirect: 'error',
                body: payload,
                signal: aborter.signal,
            },
        );

        return { promise, aborter };
    }
}