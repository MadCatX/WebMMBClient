/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AnyObject } from '../util/json';

type ApiRequestType =
    'StartJob'        |
    'StartJobRaw'     |
    'StopJob'         |
    'DeleteJob'       |
    'JobStatus'       |
    'ListJobs'        |
    'MmbOutput'       |
    'JobCommands'     |
    'JobCommandsRaw'  |
    'SessionInfo'     |
    'CloneJob'        |
    'ListExamples'    |
    'ActivateExample';

type AuthRequestType =
    'LogIn' |
    'LogOut';

export type JobState = 'NotStarted' | 'Running' | 'Finished' | 'Failed';
export type JobStep = number | 'preparing' | 'none';
export type JobTotalSteps = number | 'none';
export type JobCommandsMode = 'Synthetic' | 'Raw';

/* Requests */

export type ApiRequest<T> = {
    req_type: ApiRequestType,
    data: T,
}

export type AuthRequest = {
    auth_type: AuthRequestType,
    session_id: string,
}

export type CloneJobRqData = {
    id: string,
    name: string,
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

export type StartJobRawRqData = {
    name: string,
    commands: string,
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

export type ExampleListItem = {
    name: string,
    description: string,
}

export type JobInfo = {
    id: string,
    name: string,
    state: JobState,
    step: JobStep,
    total_steps: JobTotalSteps,
    available_stages: number[],
    current_stage: number|undefined,
    created_on: number,
    commands_mode: JobCommandsMode,
}

export type JobListItem = {
    ok: boolean,
    info: JobInfo,
}

export type SessionInfo = {
    id: string,
}