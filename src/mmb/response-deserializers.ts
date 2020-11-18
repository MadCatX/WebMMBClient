/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { checkProps, checkType, isArr, isBool, isInt, isObj, isStr } from '../util/json';

const NOT_AN_OBJ = 'Input variable is not an object';

const JobInfoObj: Api.JobInfo = {
    id: '',
    name: '',
    state: 'NotStarted',
    step: 'none',
    total_steps: 0,
    last_completed_stage: 0,
};
const JobListItemObj: Api.JobListItem = {
    ok: false,
    info: JobInfoObj,
};
const SessionInfoObj: Api.SessionInfo = { id: '' };

function isJobState(v: string): v is Api.JobState {
    return v === 'NotStarted' ||
           v === 'Running'    ||
           v === 'Finished'   ||
           v === 'Failed';
}

function isJobStep(v: number | string): v is Api.JobStep {
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
        if (!isObj(obj))
            throw new Error(NOT_AN_OBJ);

        checkProps(obj, JobInfoObj);

        const tObj = obj as Api.JobInfo;
        checkType(tObj, 'id', isStr);
        checkType(tObj, 'name', isStr);
        checkType(tObj, 'state', isJobState);
        checkType(tObj, 'step', isJobStep);
        checkType(tObj, 'total_steps', isInt);
        checkType(tObj, 'last_completed_stage', isInt);

        return {
            id: tObj.id,
            name: tObj.name,
            state: tObj.state,
            step: tObj.step,
            total_steps: tObj.total_steps,
            last_completed_stage: tObj.last_completed_stage,
        };
    }

    function toJobListItem(obj: unknown): Api.JobListItem {
        if (!isObj(obj))
            throw new Error(NOT_AN_OBJ);

        checkProps(obj, JobListItemObj);

        const tObj = obj as Api.JobListItem;
        checkType(tObj, 'ok', isBool);

        const info = toJobInfo(tObj.info);

        return {
            ok: tObj.ok,
            info,
        };
    }

    export function toJobList(obj: unknown): Api.JobListItem[] {
        if (!isArr(obj))
            throw new Error('Input variable is not an array');

        const list: Api.JobListItem[] = [];
        for (const item of obj)  {
            list.push(toJobListItem(item));
        }

        return list;
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