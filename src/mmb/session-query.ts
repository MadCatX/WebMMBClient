import { ApiRequest } from './api';
import { Request } from './request';

export namespace SessionQuery {
    export function info() {
        const req: ApiRequest<null> = { req_type: 'SessionInfo', data: null };
        return Request.api(req);
    }
}