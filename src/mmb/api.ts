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
    'CreateJob'       |
    'DeleteJob'       |
    'JobStatus'       |
    'ListJobs'        |
    'MmbOutput'       |
    'JobCommands'     |
    'JobCommandsRaw'  |
    'SessionInfo'     |
    'CloneJob'        |
    'ListExamples'    |
    'ActivateExample' |
    'FileTransfer';

type AuthRequestType =
    'LogIn' |
    'LogOut';

export type JobState = 'NotStarted' | 'Running' | 'Finished' | 'Failed';
export type JobStep = number | 'preparing' | 'none';
export type JobTotalSteps = number | 'none';
export type JobCommandsMode = 'None' | 'Synthetic' | 'Raw';
export type FileTransferRequestType = 'Init' | 'Finish';

/* JSON commands */

export type ExtraFile = {
    key: string;
    name: string;
    data: string;
};

export type MobilizerParameter = {
    bond_mobility: string;
    chain?: string;
    first_residue?: number;
    last_residue?: number;
};

export type JsonAdvancedParameters = Record<string, string | boolean | number | null>;

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
    extra_files: ExtraFile[];
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

/* This request is transferred as raw bytes instead of JSON */
export type TransferChunk = {
    job_id: Uint8Array,
    transfer_id: Uint8Array,
    data: Uint8Array,
}

export type CloneJobRqData = {
    id: string,
    name: string,
}

export type CreateJobRqData = {
    name: string,
}

export type FileTransferRqData = {
    req_type: FileTransferRequestType,
    job_id: string,
    transfer_id: string,
    file_name: string,
}

export type SimpleJobRqData = {
    id: string,
}

export type ResumeJobRqData = {
    id: string,
    commands: JsonCommands,
}

export type StartJobRqData = {
    id: string,
    commands: JsonCommands,
}

export type StartJobRawRqData = {
    id: string,
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

export type FileTransferInfo = {
    id: string,
}

export type JobCommands = {
    is_empty: boolean;
    commands: JsonCommands|null;
}

export type JobCommandsRaw = {
    is_empty: boolean;
    commands: string|null;
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