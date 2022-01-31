/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for defails.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Conversion } from './index';
import { ParameterNames } from '../../mmb/available-parameters';
import { AdditionalFile } from '../mmb/additional-file';
import { AdvancedParameters } from '../mmb/advanced-parameters';
import { DensityFitFile } from '../mmb/density-fit-file';
import { DensityFitFiles } from '../mmb/density-fit-files';
import { MmbSetup } from '../mmb/mmb-setup';
import { StagesSpan } from '../mmb/stages-span';
import { CommonCommands, DensityFitCommands, StandardCommands } from '../../mmb/api';
import { JsonCommandsDeserializer } from '../../mmb/commands-deserializer';
import { Commands as Cmds } from '../../mmb/commands';

export namespace FromCommands {

function commonCommands(commands: CommonCommands) {
    const global = JsonCommandsDeserializer.toGlobal(commands);
    const reporting = JsonCommandsDeserializer.toReporting(commands);
    const stage = JsonCommandsDeserializer.toStage(commands);

    return {
        global,
        reporting,
        stage,
    };
}

function densityFitCommandsToParameters(commands: DensityFitCommands): Conversion.Result<Cmds.DensityFitParameters> {
    try {
        const densityFitFiles = JsonCommandsDeserializer.toDensityFitFiles(commands);
        const compounds = JsonCommandsDeserializer.toCompounds(commands);
        const mobilizers = JsonCommandsDeserializer.toMobilizers(commands);
        const ntcs = JsonCommandsDeserializer.toNtCs(commands);
        const md = JsonCommandsDeserializer.toMdParams(commands);
        const common = commonCommands(commands);

        return {
            type: 'ok',
            data: {
                jobType: 'density-fit',
                ...common,
                densityFitFiles,
                compounds,
                mobilizers,
                ntcs,
                mdParameters: md,
            },
        };
    } catch (e) {
        return {
            type: 'error',
            errors: [(e as Error).toString()],
        };
    }
}

function standardCommandsToParameters(commands: StandardCommands, files: AdditionalFile[]): Conversion.Result<Cmds.StandardParameters<ParameterNames>> {
    try {
        const common = commonCommands(commands);
        const compounds = JsonCommandsDeserializer.toCompounds(commands);
        const baseInteractions = JsonCommandsDeserializer.toBaseInteractions(commands);
        const doubleHelices = JsonCommandsDeserializer.toDoubleHelices(commands);
        const ntcs = JsonCommandsDeserializer.toNtCs(commands);
        const md = JsonCommandsDeserializer.toMdParams(commands);
        const mobilizers = JsonCommandsDeserializer.toMobilizers(commands);

        const advParams = new AdvancedParameters.Type();
        const obj = JsonCommandsDeserializer.toAdvancedParameters(commands, files);
        for (const prop in obj) {
            const val = obj[prop];
            if (val === null)
                advParams.set(prop as ParameterNames, undefined);
            else
                advParams.set(prop as ParameterNames, val);
        }

        return {
            type: 'ok',
            data: {
                jobType: 'standard',
                ...common,
                compounds,
                doubleHelices,
                baseInteractions,
                ntcs,
                mobilizers,
                mdParameters: md,
                advParams,
            },
        };
    } catch (e) {
        return {
            type: 'error',
            errors: [(e as Error).toString()],
        };
    }
}

export function toParameters(commands: DensityFitCommands|StandardCommands, files: AdditionalFile[]): Conversion.Result<Cmds.DensityFitParameters|Cmds.StandardParameters<ParameterNames>> {
    switch (commands.job_type) {
    case 'Standard':
        return standardCommandsToParameters(commands, files);
    case 'DensityFit':
        return densityFitCommandsToParameters(commands);
    }
}

export function toSetupData(commands: DensityFitCommands|StandardCommands, stages: StagesSpan, files: AdditionalFile[]): Conversion.Result<MmbSetup.Data> {
    const rParams = toParameters(commands, files);
    if (Conversion.isErrorResult(rParams))
        return rParams;

    const params = rParams.data;
    const data = MmbSetup.emptyData();

    data.global = params.global;
    data.md = params.mdParameters;
    data.reporting = params.reporting;
    // If the run stage failed to produce any results fall back to the last valid state
    data.stage = params.stage > stages.last ? stages.last : params.stage;

    switch (params.jobType) {
    case 'density-fit':
        data.compounds = params.compounds;
        data.densityFitFiles = new DensityFitFiles(
            params.densityFitFiles.structure !== '' ? DensityFitFile.fromInfo('structure', params.densityFitFiles.structure, null) : null,
            params.densityFitFiles.densityMap !== '' ? DensityFitFile.fromInfo('density-map', params.densityFitFiles.densityMap, null) : null,
        ),
        data.mobilizers = params.mobilizers;
        data.ntcs = params.ntcs.conformations;
        data.ntcForceScaleFactor = params.ntcs.forceScaleFactor;
        data.stages = stages;
        break;
    case 'standard':
        data.additionalFiles = files;
        data.advancedParameters = params.advParams;
        data.compounds = params.compounds;
        data.doubleHelices = params.doubleHelices;
        data.baseInteractions = params.baseInteractions;
        data.doubleHelices = params.doubleHelices;
        data.mobilizers = params.mobilizers;
        data.ntcs = params.ntcs.conformations;
        data.ntcForceScaleFactor = params.ntcs.forceScaleFactor;
        data.stages = stages;
    }

    return {
        type: 'ok',
        data: data,
    };
}

}
