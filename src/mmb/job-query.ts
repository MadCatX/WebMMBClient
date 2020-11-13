/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { Request } from './request';
import { JsonCommands } from '../mmb/commands';

export namespace JobQuery {
    export function commands(jobId: string)  {
        const req: Api.ApiRequest<Api.SimpleJobRqData> = {
            req_type: 'JobCommands',
            data: { id: jobId },
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

    export function resume(id: string, commands: JsonCommands) {
        const req: Api.ApiRequest<Api.ResumeJobRqData> = {
            req_type: 'ResumeJob',
            data: { id, commands },
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

    export function start(name: string, commands: JsonCommands) {
        const req: Api.ApiRequest<Api.StartJobRqData> = {
            req_type: 'StartJob',
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