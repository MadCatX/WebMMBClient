/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { checkProps, checkType, isArr, isBool, isInt, isObj, isStr } from '../util/json';
import { Num } from '../util/num';

const NOT_AN_OBJ = 'Input variable is not an object';

const JobInfoObj: Api.JobInfo = {
    id: '',
    name: '',
    state: 'NotStarted',
    step: 'none',
    total_steps: 0,
    available_stages: [] as number[],
    created_on: 0,
};
const JobListItemObj: Api.JobListItem = {
    ok: false,
    info: JobInfoObj,
};
const SessionInfoObj: Api.SessionInfo = { id: '' };

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
        checkType(tObj, 'created_on', isInt);
    } catch (e) {
        console.error(e);
        return false;
    }

    return true;
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

export namespace ResponseDeserializers {
    export function toEmpty(obj: unknown): Api.Empty {
        if (!isObj(obj))
            throw new Error(NOT_AN_OBJ);

        if (Object.keys(obj).length > 0)
            throw new Error('Object is not empty');
        return {};
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
                created_on: Num.parseIntStrict(obj.created_on),  // On-wire value is a string to prevent rounding
            };
        } else
            throw new Error('Object is not JobInfo');
    }

    function toJobListItem(obj: unknown): Api.JobListItem {
        if (isJobListItem(obj)) {
            return {
                ok: obj.ok,
                info: obj.info,
            };
        } else
            throw new Error('Object is not JobListItem');
    }

    export function toJobList(obj: unknown): Api.JobListItem[] {
        if (isArr(obj, isJobListItem)) {
            const list = new Array<Api.JobListItem>();
            for (const item of obj)  {
                list.push(toJobListItem(item));
            }
            return list;
        } else
            throw new Error('Object is not JobListItem array');
    }

    export function toMmbOutput(obj: unknown): string {
        if (!isStr(obj))
            throw new Error('Input variable is not a string');
        return obj as string;
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