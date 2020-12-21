/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { Request } from './request';

export namespace AppQuery {
    export function activateExample(name: string) {
        const req: Api.ApiRequest<Api.SimpleJobRqData> = {
            req_type: 'ActivateExample',
            data: { id: name }
        };
        return Request.api(req);
    }

    export function listExamples() {
        const req: Api.ApiRequest<null> = {
            req_type: 'ListExamples',
            data: null,
        };
        return Request.api(req);
    }

    export function sessionInfo() {
        const req: Api.ApiRequest<null> = { req_type: 'SessionInfo', data: null };
        return Request.api(req);
    }
}
