/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AnyObject } from '../util/json';

type ApiRequestType =
    'StartJob'    |
    'StopJob'     |
    'ResumeJob'   |
    'DeleteJob'   |
    'JobStatus'   |
    'ListJobs'    |
    'MmbOutput'   |
    'JobCommands' |
    'SessionInfo';

type AuthRequestType =
    'LogIn' |
    'LogOut';

export type JobState = 'NotStarted' | 'Running' | 'Finished' | 'Failed';
export type JobStep = number | 'preparing' | 'none';
export type JobTotalSteps = number | 'none';

/* Requests */

export type ApiRequest<T> = {
    req_type: ApiRequestType,
    data: T,
}

export type AuthRequest = {
    auth_type: AuthRequestType,
    session_id: string,
}

export type SimpleJobRqData = {
    id: string,
}

export type ResumeJobRqData = {
    id: string,
    commands: AnyObject,
}

export type StartJobRqData = {
    name: string,
    commands: AnyObject,
}

/* Responses */

export type BaseResponse = {
    success: boolean,
}
export const BaseResponseObj: BaseResponse = { success: false };

export type ErrorResponse = {
    success: boolean,
    message: string,
}
export const ErrorResponseObj: ErrorResponse = { success: false, message: '' };

export type OkResponse<T> = {
    success: boolean,
    data: T,
}

const Empty = {};
export type Empty = typeof Empty;

export type JobInfo = {
    id: string,
    name: string,
    state: JobState,
    step: JobStep,
    total_steps: JobTotalSteps,
    last_available_stage: number,
    last_completed_stage: number,
    created_on: number,
}

export type JobListItem = {
    ok: boolean,
    info: JobInfo,
}

export type SessionInfo = {
    id: string,
}