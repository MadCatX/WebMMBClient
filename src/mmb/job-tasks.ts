/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { JobQuery } from './job-query';
import { ResponseDeserializers } from './response-deserializers';
import { Tasks as T } from './tasks';

export namespace JobTasks {
    export function commands(id: string) {
        return T.task(() => JobQuery.commands(id), ResponseDeserializers.toJobCommands, 'Cannot query synthetic job commands');
    }

    export function commandsRaw(id: string) {
        return T.task(() => JobQuery.commands_raw(id), ResponseDeserializers.toJobCommandsRaw, 'Cannot query raw job commands');
    }

    export function create(name: string) {
        return T.task(() => JobQuery.create(name), ResponseDeserializers.toJobInfo, 'Cannot create job');
    }

    export function del(id: string) {
        return T.task(() => JobQuery.del(id), ResponseDeserializers.toEmpty, 'Cannot delete job');
    }

    export function fetchInfo(id: string) {
        return T.task(() => JobQuery.status(id), ResponseDeserializers.toJobInfo, 'Cannot query job info');
    }

    export function fetchMmbOutput(id: string) {
        return T.task(() => JobQuery.mmbOutput(id), ResponseDeserializers.toMmbOutput, 'Cannot query MMB output');
    }

    export function list() {
        return T.task(() => JobQuery.list(), ResponseDeserializers.toJobList, 'Cannot query list of jobs');
    }

    export function start(id: string, commands: Api.JsonCommands) {
        return T.task(() => JobQuery.start(id, commands), ResponseDeserializers.toJobInfo, 'Cannot start job');
    }

    export function startRaw(id: string, commands: string) {
        return T.task(() => JobQuery.startRaw(id, commands), ResponseDeserializers.toJobInfo, 'Cannot start raw job');
    }

    export function stop(id: string) {
        return T.task(() => JobQuery.stop(id), ResponseDeserializers.toJobInfo, 'Cannot stop job');
    }
}
