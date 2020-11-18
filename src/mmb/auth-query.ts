/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AuthRequest } from './api';
import { Request } from './request';

export namespace AuthQuery {
    export function logIn(session_id: string) {
        const req: AuthRequest = { auth_type: 'LogIn', session_id };
        return Request.auth(req);
    }

    export function logOut() {
        const req: AuthRequest = { auth_type: 'LogOut', session_id: '' };
        return Request.auth(req);
    }
}