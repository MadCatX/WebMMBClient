/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { JobRequest } from './job-request';
import { ResponseDeserializers } from './response-deserializers';
import { Query as Q } from './query';

export namespace JobQuery {
    export function commands(id: string) {
        return Q.query(() => JobRequest.commands(id), ResponseDeserializers.toJobCommands, 'Cannot query synthetic job commands');
    }

    export function commandsRaw(id: string) {
        return Q.query(() => JobRequest.commands_raw(id), ResponseDeserializers.toJobCommandsRaw, 'Cannot query raw job commands');
    }

    export function create(name: string) {
        return Q.query(() => JobRequest.create(name), ResponseDeserializers.toJobCreated, 'Cannot create job');
    }

    export function del(id: string) {
        return Q.query(() => JobRequest.del(id), ResponseDeserializers.toEmpty, 'Cannot delete job');
    }

    export function fetchInfo(id: string) {
        return Q.query(() => JobRequest.status(id), ResponseDeserializers.toJobInfo, 'Cannot query job info');
    }

    export function fetchMmbOutput(id: string) {
        return Q.query(() => JobRequest.mmbOutput(id), ResponseDeserializers.toMmbOutput, 'Cannot query MMB output');
    }

    export function list() {
        return Q.query(() => JobRequest.list(), ResponseDeserializers.toJobList, 'Cannot query list of jobs');
    }

    export function listAdditionalFiles(id: string) {
        return Q.query(() => JobRequest.listAdditionalFiles(id), ResponseDeserializers.toAdditionalFileList, 'Cannot query list of additional files');
    }

    export function start(id: string, commands: Api.JsonCommands) {
        return Q.query(() => JobRequest.start(id, commands), ResponseDeserializers.toEmpty, 'Cannot start job');
    }

    export function startRaw(id: string, commands: string) {
        return Q.query(() => JobRequest.startRaw(id, commands), ResponseDeserializers.toEmpty, 'Cannot start raw job');
    }

    export function stop(id: string) {
        return Q.query(() => JobRequest.stop(id), ResponseDeserializers.toEmpty, 'Cannot stop job');
    }
}
