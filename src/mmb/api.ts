/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

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

/* JSON commands */

export type MobilizerParameter = {
    bond_mobility: string;
    chain?: string;
    first_residue?: number;
    last_residue?: number;
};

export type JsonAdvancedParameters = Record<string, string | boolean | number>;

export type JsonCommands = {
    base_interaction_scale_factor: number,
    use_multithreaded_computation: boolean,
    temperature: number,
    first_stage: number,
    last_stage: number,
    reporting_interval: number,
    num_reporting_intervals: number,
    sequences: string[],
    double_helices: string[],
    base_interactions: string[],
    ntcs: string[],
    mobilizers: MobilizerParameter[],
    adv_params: JsonAdvancedParameters,
    set_default_MD_parameters: boolean,
};

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
    commands: JsonCommands,
}

export type StartJobRqData = {
    name: string,
    commands: JsonCommands,
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
    current_stage: number|null,
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