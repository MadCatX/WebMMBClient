/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { ApiRequest, AuthRequest } from './api';

export namespace Request {
    export function api<T>(req: ApiRequest<T>) {
        return fetch(
            '/api',
            {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'error',
                body: JSON.stringify(req),
            },
        );
    }

    export function auth(req: AuthRequest) {
        return fetch(
            '/auth',
            {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'follow',
                body: JSON.stringify(req),
            },
        );
    }
}