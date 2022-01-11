/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

type ApiRequestType =
    'StartJob'           |
    'StartJobRaw'        |
    'StopJob'            |
    'CreateJob'          |
    'DeleteJob'          |
    'JobStatus'          |
    'ListJobs'           |
    'MmbOutput'          |
    'JobCommands'        |
    'JobCommandsRaw'     |
    'SessionInfo'        |
    'CloneJob'           |
    'ListExamples'       |
    'ActivateExample'    |
    'FileOperation'      |
    'ListAdditionalFiles';

type AuthRequestType =
    'LogIn' |
    'LogOut';

export type EdgeInteraction = 'WatsonCrick' | 'SugarEdge';
export type JobState = 'NotStarted' | 'Running' | 'Finished' | 'Failed';
export type JobStep = number | 'preparing' | 'none';
export type JobTotalSteps = number | 'none';
export type JobType = 'Standard' | 'DensityFit';
export type JobCommandsMode = 'None' | 'Synthetic' | 'Raw';
export type FileOperationRequestType = 'InitUpload' | 'FinishUpload' | 'CancelUpload' | 'Delete';
export type Orientation = 'Cis' | 'Trans';

/* JSON commands */

export type Chain = {
    name: string;
    auth_name: string;
}

export type ResidueNumber = {
    number: number;
    auth_number: number;
}

export type BaseInteraction = {
    chain_name_1: string;
    res_no_1: number;
    edge_1: EdgeInteraction;
    chain_name_2: string;
    res_no_2: number;
    edge_2: EdgeInteraction;
    orientation: Orientation;
}

export type Compound = {
    chain: Chain;
    ctype: 'DNA' | 'RNA' | 'Protein';
    sequence: string;
    residues: ResidueNumber[];
}

export type DoubleHelix = {
    chain_name_1: string;
    first_res_no_1: number;
    last_res_no_1: number;
    chain_name_2: string;
    first_res_no_2: number;
    last_res_no_2: number;
}

export type JsonAdvancedParameters = Record<string, string | boolean | number | null>;

export type Mobilizer = {
    bond_mobility: string;
    chain?: string;
    first_residue?: number;
    last_residue?: number;
}

export type NtCConformation = {
    chain_name: string;
    first_res_no: number;
    last_res_no: number;
    ntc: string;
    weight: number;
}

export type NtCs = {
    conformations: NtCConformation[];
    force_scale_factor: number;
}

export type CommonCommands = {
    reporting_interval: number,
    num_reporting_intervals: number,
    first_stage: number,
    last_stage: number,
    base_interaction_scale_factor: number,
    temperature: number,
}

export type StandardCommands = CommonCommands & {
    job_type: 'Standard',
    compounds: Compound[],
    double_helices: DoubleHelix[],
    base_interactions: BaseInteraction[],
    ntcs: NtCs,
    mobilizers: Mobilizer[],
    adv_params: JsonAdvancedParameters,
    set_default_MD_parameters: boolean,
}

export type DensityFitCommands = CommonCommands & {
    job_type: 'DensityFit',
    structure_file_name: string,
    density_map_file_name: string,
    compounds: Compound[],
    mobilizers: Mobilizer[],
    ntcs: NtCs,
    set_default_MD_parameters: boolean,
}

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
export type FileTransferChunk = {
    job_id: Uint8Array,
    transfer_id: Uint8Array,
    index: Uint8Array,
    data: Uint8Array,
}

export type CloneJobRqData = {
    id: string,
    name: string,
}

export type CreateJobRqData = {
    name: string,
}

export type FileOperationRqData = {
    req_type: FileOperationRequestType,
    job_id: string,
    transfer_id: string,
    file_name: string,
}

export type SimpleJobRqData = {
    id: string,
}

export type ResumeJobRqData = {
    id: string,
    commands: StandardCommands|DensityFitCommands,
}

export type StartJobRqData = {
    id: string,
    commands: StandardCommands|DensityFitCommands,
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

export type AdditionalFile = {
    name: string,
    size: string,
}

const Empty = {};
export type Empty = typeof Empty;

export type ExampleListItem = {
    name: string,
    description: string,
}

export type FileTransferAck = {
    id: string,
}

export type JobCommands = {
    is_empty: boolean;
    commands: StandardCommands|DensityFitCommands|null;
}

export type JobCommandsRaw = {
    is_empty: boolean;
    commands: string|null;
}

export type JobCreated = {
    id: string;
}

export type JobInfo = {
    id: string,
    name: string,
    state: JobState,
    available_stages: number[],
    current_stage: number|null,
    created_on: number,
    commands_mode: JobCommandsMode,
    progress: JobProgress|null,
}

export type JobProgress = {
    step: JobStep,
    total_steps: JobTotalSteps,
}

export type JobList = JobInfo[];

export type SessionInfo = {
    id: string,
}