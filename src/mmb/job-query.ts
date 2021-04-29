/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { Request } from './request';

export namespace JobQuery {
    export function commands(jobId: string)  {
        const req: Api.ApiRequest<Api.SimpleJobRqData> = {
            req_type: 'JobCommands',
            data: { id: jobId },
        };
        return Request.api(req);
    }

    export function commands_raw(jobId: string)  {
        const req: Api.ApiRequest<Api.SimpleJobRqData> = {
            req_type: 'JobCommandsRaw',
            data: { id: jobId },
        };
        return Request.api(req);
    }

    export function clone(id: string, name: string) {
        const req: Api.ApiRequest<Api.CloneJobRqData> = {
            req_type: 'CloneJob',
            data: { id, name },
        };
        return Request.api(req);
    }

    export function del(id: string) {
        const req: Api.ApiRequest<Api.SimpleJobRqData> = {
            req_type: 'DeleteJob',
            data: { id },
        };
        return Request.api(req);
    }

    export function list() {
        const req: Api.ApiRequest<null> = {
            req_type: 'ListJobs',
            data: null,
        };
        return Request.api(req);
    }

    export function mmbOutput(id: string) {
        const req: Api.ApiRequest<Api.SimpleJobRqData> = {
            req_type: 'MmbOutput',
            data: { id },
        };
        return Request.api(req);
    }

    export function status(jobId: string) {
        const req: Api.ApiRequest<Api.SimpleJobRqData> = {
            req_type: 'JobStatus',
            data: { id: jobId },
        };
        return Request.api(req);
    }

    export function start(name: string, commands: Api.JsonCommands) {
        const req: Api.ApiRequest<Api.StartJobRqData> = {
            req_type: 'StartJob',
            data: { name, commands },
        };
        return Request.api(req);
    }

    export function startRaw(name: string, commands: string) {
        const req: Api.ApiRequest<Api.StartJobRawRqData> = {
            req_type: 'StartJobRaw',
            data: { name, commands },
        };
        return Request.api(req);
    }

    export function stop(jobId: string) {
        const req: Api.ApiRequest<Api.SimpleJobRqData> = {
            req_type: 'StopJob',
            data: { id: jobId },
        };
        return Request.api(req);
    }
}