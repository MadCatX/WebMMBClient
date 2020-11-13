/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { ApiRequest } from './api';
import { Request } from './request';

export namespace SessionQuery {
    export function info() {
        const req: ApiRequest<null> = { req_type: 'SessionInfo', data: null };
        return Request.api(req);
    }
}