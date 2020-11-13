import * as Api from './api';
import { checkProps, checkType, isArr, isInt, isObj, isStr } from '../util/json';

const JobInfoObj: Api.JobInfo = {
    id: '',
    name: '',
    status: 'none',
    step: 'none',
    total_steps: 0,
    last_completed_stage: 0,
};
const SessionInfoObj: Api.SessionInfo = { username: '' };

function isJobStatus(v: string): v is Api.JobStatus {
    return Api.JobStatusIdentifiers.includes(v as Api.JobStatus);
}

function isJobStep(v: number | string): v is Api.JobStep {
    return !isNaN(parseInt(v as string)) || v === 'preparing';
}

export namespace ResponseDeserializers {
    export function toJobInfo(obj: unknown): Api.JobInfo {
        if (!isObj(obj))
            throw new Error('Input variable is not an object');

        checkProps(obj, JobInfoObj);

        const tObj = obj as Api.JobInfo;
        checkType(tObj, 'id', isStr);
        checkType(tObj, 'name', isStr);
        checkType(tObj, 'status', isJobStatus);
        checkType(tObj, 'step', isJobStep);
        checkType(tObj, 'total_steps', isInt);
        checkType(tObj, 'last_completed_stage', isInt);

        return {
            id: tObj.id,
            name: tObj.name,
            status: tObj.status,
            step: tObj.step,
            total_steps: tObj.total_steps,
            last_completed_stage: tObj.last_completed_stage,
        };
    }

    export function toJobList(obj: unknown) {
        if (!isArr(obj))
            throw new Error('Input variable is not an array');

        const list: Api.JobInfo[] = [];
        for (const item of obj)  {
            list.push(toJobInfo(item));
        }

        return list;
    }

    export function toSessionInfo(obj: unknown): Api.SessionInfo {
        if (!isObj(obj))
            throw new Error('Input variable is not an object');

        checkProps(obj, SessionInfoObj);

        const tObj = obj as Api.SessionInfo;
        checkType(tObj, 'username', isStr);

        return { username: tObj.username };
    }

}