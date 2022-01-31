/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import * as AO from './api-objs';
import { Commands } from './commands';
import { assignAll, checkProps, checkType, isArr, isInt, isObj, isStr, TypeChecker } from '../util/json';
import { Num } from '../util/num';

const NOT_AN_OBJ = 'Input variable is not an object';

const AdditionalFile: Api.AdditionalFile = { name: '', size: '0' };
const ExampleListItemObj: Api.ExampleListItem = {
    name: '',
    description: '',
};
const FileTransferAck: Api.FileTransferAck = { id: '' };
const JobCommandsNone: Api.JobCommandsNone = {
    mode: 'None',
};
const JobCommandsSynthetic: Api.JobCommandsSynthetic = {
    mode: 'Synthetic',
    commands: AO.StandardCommands,
};
const JobCommandsRaw: Api.JobCommandsRaw = {
    mode: 'Raw',
    commands: '',
};
const JobCreated: Api.JobCreated = { id: '' };
const JobInfo: Api.JobInfo = {
    id: '',
    name: '',
    state: 'NotStarted',
    first_stage: 0,
    last_stage: 0,
    created_on: 0,
    commands_mode: 'None',
    progress: null,
};
const JobProgress: Api.JobProgress = {
    step: 'none',
    total_steps: 0,
};

const SessionInfoObj: Api.SessionInfo = { id: '' };

function isAdditionalFile(v: unknown): v is Api.AdditionalFile {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, AdditionalFile))
            return false;

        checkType(v, 'name', isStr);
        checkType(v, 'size', isStr);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isExampleListItem(v: unknown): v is Api.ExampleListItem {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, ExampleListItemObj))
            return false;

        checkType(v, 'name', isStr);
        checkType(v, 'description', isStr);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isFileTransferAck(v: unknown): v is Api.FileTransferAck {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, FileTransferAck))
            return false;

        checkType(v, 'id', isStr);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isJobCreated(v: unknown): v is Api.JobCreated {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, JobCreated))
            return false;

        checkType(v, 'id', isStr);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isJobInfo(v: unknown): v is Api.JobInfo {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, JobInfo))
            return false;

        checkType(v, 'id', isStr);
        checkType(v, 'name', isStr);
        checkType(v, 'state', isJobState);
        checkType(v, 'first_stage', isInt),
        checkType(v, 'last_stage', isInt),
        checkType(v, 'created_on', isInt);
        checkType(v, 'commands_mode', isJobCommandsMode);
        if (v.progress !== null)
            checkType(v, 'progress', isJobProgress);
    } catch (e) {
        console.error(e);
        return false;
    }

    return true;
}

function isJobProgress(v: unknown): v is Api.JobProgress {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, JobProgress))
            return false;

        checkType(v, 'step', isJobStep);
        checkType(v, 'total_steps', isInt);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isJobCommands(v: unknown): v is Api.JobCommandsNone|Api.JobCommandsSynthetic|Api.JobCommandsRaw {
    if (!isObj(v))
        return false;

    if (v['mode'] === undefined)
        return false;

    return isJobCommandsMode(v['mode']);
}

function isJobCommandsNone(v: unknown): v is Api.JobCommandsNone {
    if (!isJobCommands(v))
        return false;

    if (!checkProps(v, JobCommandsNone))
        return false;
    return v.mode === 'None';
}

function isJobCommandsSynthetic(v: unknown): v is Api.JobCommandsSynthetic {
    if (!isJobCommands(v))
        return false;

    try {
        if (!checkProps(v, JobCommandsSynthetic))
            return false;
        if (v.mode !== 'Synthetic')
            return false;

        return (Commands.isDensityFit(v.commands) || Commands.isStandard(v.commands));
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isJobCommandsRaw(v: unknown): v is Api.JobCommandsRaw {
    if (!isJobCommands(v))
        return false;

    try {
        if (!checkProps(v, JobCommandsRaw))
            return false;
        if (v.mode !== 'Raw')
            return false;

        checkType(v, 'commands', isStr);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isJobCommandsMode(v: unknown): v is Api.JobState {
    if (!isStr(v))
        return false;
    return v === 'Synthetic' || v === 'Raw' || v === 'None';
}

function isJobState(v: unknown): v is Api.JobState {
    if (!isStr(v))
        return false;
    return v === 'NotStarted' ||
           v === 'Running'    ||
           v === 'Finished'   ||
           v === 'Failed';
}

function isJobStep(v: unknown): v is Api.JobStep {
    if (!(isStr(v) || isInt(v)))
        return false;
    return !isNaN(parseInt(v as string)) || v === 'preparing';
}

function mkObj<T extends object>(src: Record<string, unknown>, template: T): T {
    const ret = Object.create(template);
    assignAll(ret, src, template);
    return ret;
}

export namespace ResponseDeserializers {
    interface TypeConverter<T> {
        (obj: unknown): T;
    }

    function toList<T>(obj: unknown, checker: TypeChecker<T>, converter: TypeConverter<T>): T[] {
        if (isArr(obj, checker))
            return obj.map(item => converter(item));
        throw new Error();
    }

    export function toAdditionalFile(obj: unknown): Api.AdditionalFile {
        if (isAdditionalFile(obj))
            return mkObj(obj, AdditionalFile);
        throw new Error('Object is not AdditionalFile');
    }

    export function toAdditionalFileList(obj: unknown): Api.AdditionalFile[] {
        try {
            return toList(obj, isAdditionalFile, toAdditionalFile);
        } catch (e) {
            throw new Error('Object is not an array of AdditionalFile objects');
        }
    }

    export function toEmpty(obj: unknown): Api.Empty {
        if (!isObj(obj))
            throw new Error(NOT_AN_OBJ);

        if (Object.keys(obj).length > 0)
            throw new Error('Object is not empty');
        return {};
    }

    export function toExampleListItem(obj: unknown): Api.ExampleListItem {
        if (isExampleListItem(obj))
            return mkObj(obj, ExampleListItemObj);
        throw new Error('Object is not ExampleListItem');
    }

    export function toExampleList(obj: unknown): Api.ExampleListItem[] {
        try {
            return toList(obj, isExampleListItem, toExampleListItem);
        } catch (_) {
            throw new Error('Object is not ExampleList');
        }
    }

    export function toFileTransferAck(obj: unknown): Api.FileTransferAck {
        if (isFileTransferAck(obj))
            return mkObj(obj, FileTransferAck);
        throw new Error('Object is not FileTransferAck');
    }

    export function toJobCommands(obj: unknown): Api.JobCommandsNone|Api.JobCommandsSynthetic|Api.JobCommandsRaw {
        if (isJobCommandsNone(obj))
            return obj;
        else if (isJobCommandsSynthetic(obj))
            return obj;
        else if (isJobCommandsRaw(obj))
            return obj;

        throw new Error('Object is not JobCommands');
    }

    export function toJobCreated(obj: unknown): Api.JobCreated {
        if (isJobCreated(obj))
            return mkObj(obj, JobCreated);

        throw new Error('Object is not JobCreated');
    }

    export function toJobInfo(obj: unknown): Api.JobInfo {
        if (isJobInfo(obj)) {
            const progress = obj.progress ? mkObj(obj.progress, JobProgress) : null;
            return {
                id: obj.id,
                name: obj.name,
                state: obj.state,
                first_stage: obj.first_stage,
                last_stage: obj.last_stage,
                created_on: Num.parseIntStrict(obj.created_on),  // On-wire value is a string to prevent rounding
                commands_mode: obj.commands_mode,
                progress,
            };
        } else
            throw new Error('Object is not JobInfo');
    }

    export function toJobList(obj: unknown): Api.JobList {
        try {
            return toList(obj, isJobInfo, toJobInfo);
        } catch (_) {
            throw new Error('Object is not JobListItem array');
        }
    }

    export function toMmbOutput(obj: unknown): string {
        if (!isStr(obj))
            throw new Error('Input variable is not a string');
        return obj;
    }

    export function toSessionInfo(obj: unknown): Api.SessionInfo {
        if (!isObj(obj))
            throw new Error(NOT_AN_OBJ);

        if (!checkProps(obj, SessionInfoObj))
            throw new Error('Object is not SessionInfo');

        checkType(obj, 'id', isStr);

        return { id: obj.id };
    }
}