import { FromCommands } from './from-commands';
import { FromSetup } from './from-setup';
import { Mmb } from '../mmb';
import { AdditionalFile } from '../mmb/additional-file';
import { MmbSetup } from '../mmb/mmb-setup';
import { StagesSpan } from '../mmb/stages-span';
import { DensityFitCommands, StandardCommands } from '../../mmb/api';

export namespace Conversion {

export type ResultType = 'ok' | 'error';
export type OkResult<R> = {
    type: 'ok';
    data: R;
}
export type ErrorResult = {
    type: 'error';
    errors: string[];
}
export type Result<R> = OkResult<R>|ErrorResult;

export function isErrorResult<R>(r: Result<R>): r is ErrorResult {
    return r.type === 'error';
}
export function isOkResult<R>(r: Result<R>): r is OkResult<R> {
    return r.type === 'ok';
}

export function setupToParameters(setup: MmbSetup, mode: Mmb.SyntheticModes) {
    return FromSetup.toParameters(setup, mode);
}

export function parametersFromCommands(commands: DensityFitCommands|StandardCommands, files: AdditionalFile[]) {
    return FromCommands.toParameters(commands, files);
}

export function setupFromCommands(setup: MmbSetup, commands: DensityFitCommands|StandardCommands, stages: StagesSpan, files: AdditionalFile[], reannounce = true): Result<void> {
    const result = FromCommands.toSetupData(commands, stages, files);
    if (isErrorResult(result))
        return result;

    const errors = setup.reset(result.data, reannounce);
    if (errors) {
        return {
            type: 'error',
            errors,
        };
    }

    return {
        type: 'ok',
        data: void 0,
    };
}

}
