/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { isJsonCommands, jsonCommandsFromJson } from './commands';
import { assignAll, checkProps, checkType, isArr, isBool, isInt, isObj, isStr, TypeChecker } from '../util/json';
import { Num } from '../util/num';

const NOT_AN_OBJ = 'Input variable is not an object';

const AdditionalFile: Api.AdditionalFile = { name: '', size: '0' };
const ExampleListItemObj: Api.ExampleListItem = {
    name: '',
    description: '',
};
const FileTransferAck: Api.FileTransferAck = { id: '', challenge: new Uint8Array() };
const JobCommands: Api.JobCommands = { is_empty: true, commands: null };
const JobCommandsRaw: Api.JobCommandsRaw = { is_empty: true, commands: null };

const JobInfoObj: Api.JobInfo = {
    id: '',
    name: '',
    state: 'NotStarted',
    step: 'none',
    total_steps: 0,
    available_stages: [] as number[],
    current_stage: null,
    created_on: 0,
    commands_mode: 'Synthetic',
};
const JobListItemObj: Api.JobListItem = {
    ok: false,
    info: JobInfoObj,
};
const SessionInfoObj: Api.SessionInfo = { id: '' };

function isAdditionalFile(v: unknown): v is Api.AdditionalFile {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, AdditionalFile);

        const tObj = v as Api.AdditionalFile;
        checkType(tObj, 'name', isStr);
        checkType(tObj, 'size', isStr);

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
        checkProps(v, ExampleListItemObj);
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
        checkProps(v, FileTransferAck);

        const tObj = v as Api.FileTransferAck;
        checkType(tObj, 'id', isStr);
        checkType(
            tObj,
            'challenge',
            (v: unknown): v is Uint8Array => {
                return isArr<number>(
                    v,
                    (v: unknown): v is number => {
                        if (!isInt(v))
                            return false;
                        return v >= 0 && v <= 255;
                    }
                )
            }
        );

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isJobListItem(v: unknown): v is Api.JobListItem {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, JobListItemObj);
        checkType(v, 'ok', isBool);
        return isJobInfo(v.info);
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isJobInfo(v: unknown): v is Api.JobInfo {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, JobInfoObj);
    } catch (e) {
        console.error(e);
        return false;
    }

    const tObj = v as Api.JobInfo;
    try {
        checkType(tObj, 'id', isStr);
        checkType(tObj, 'name', isStr);
        checkType(tObj, 'state', isJobState);
        checkType(tObj, 'step', isJobStep);
        checkType(tObj, 'total_steps', isInt);
        checkType(tObj, 'available_stages', (v: unknown): v is number[] => isArr<number>(v, isInt));
        checkType(tObj, 'current_stage', (v: unknown): v is number|null => {
            if (v === null)
                return true;
            return isInt(v);
        });
        checkType(tObj, 'created_on', isInt);
        checkType(tObj, 'commands_mode', isJobCommandsMode);
    } catch (e) {
        console.error(e);
        return false;
    }

    return true;
}

function isJobCommands(v: unknown): v is Api.JobCommands {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, JobCommands);

        const tObj = v as Api.JobCommands;
        checkType(tObj, 'is_empty', isBool);

        if (!tObj.is_empty)
            checkType(tObj, 'commands', isJsonCommands);
        else {
            if (tObj.commands !== null) {
                console.error('Non-null commands in commands object that was expected empty');
                return false;
            }
        }

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isJobCommandsRaw(v: unknown): v is Api.JobCommandsRaw {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, JobCommandsRaw);

        const tObj = v as Api.JobCommandsRaw;
        checkType(tObj, 'is_empty', isBool);


        if (!tObj.is_empty)
            checkType(tObj, 'commands', isStr);
        else {
            if (tObj.commands !== null) {
                console.error('Non-null commands in commands object that was expected empty');
                return false;
            }
        }

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

    export function toJobCommands(obj: unknown): Api.JobCommands {
        if (isJobCommands(obj)) {
            if (obj.is_empty)
                return obj;
            return {
                is_empty: false,
                commands: jsonCommandsFromJson(obj.commands)
            }
        }

        throw new Error('Object is not JobCommands');
    }

    export function toJobCommandsRaw(obj: unknown): Api.JobCommandsRaw {
        if (isJobCommandsRaw(obj))
            return obj;
        throw new Error('Object is not JobCommandsRaw');
    }

    export function toJobInfo(obj: unknown): Api.JobInfo {
        if (isJobInfo(obj)) {
            return {
                id: obj.id,
                name: obj.name,
                state: obj.state,
                step: obj.step,
                total_steps: obj.total_steps,
                available_stages: obj.available_stages,
                current_stage: obj.current_stage,
                created_on: Num.parseIntStrict(obj.created_on),  // On-wire value is a string to prevent rounding
                commands_mode: obj.commands_mode,
            };
        } else
            throw new Error('Object is not JobInfo');
    }

    function toJobListItem(obj: unknown): Api.JobListItem {
        if (isJobListItem(obj))
            return mkObj(obj, JobListItemObj);
        throw new Error('Object is not JobListItem');
    }

    export function toJobList(obj: unknown): Api.JobListItem[] {
        try {
            return toList(obj, isJobListItem, toJobListItem);
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

        checkProps(obj, SessionInfoObj);

        const tObj = obj as Api.SessionInfo;
        checkType(tObj, 'id', isStr);

        return { id: tObj.id };
    }

}