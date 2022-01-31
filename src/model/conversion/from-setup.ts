import { Conversion } from './index';
import { Mmb } from '../mmb';
import { AdvancedParameters } from '../mmb/advanced-parameters';
import { MmbSetup } from '../mmb/mmb-setup';
import { NtC } from '../mmb/ntc';
import { Commands as Cmds } from '../../mmb/commands';
import { ParameterNames } from '../../mmb/available-parameters';

export namespace FromSetup {

function makeCommonParams(setup: MmbSetup): Conversion.Result<Cmds.CommonParameters> {
    const global = setup.global;

    return {
        type: 'ok',
        data: {
            global,
            reporting: setup.reporting,
            stage: setup.stage,
        },
    };
}

function standardSimple(setup: MmbSetup): Conversion.Result<Cmds.StandardParameters<ParameterNames>> {
    const common = makeCommonParams(setup);
    if (Conversion.isErrorResult(common))
        return common;

    return {
        type: 'ok',
        data: {
            jobType: 'standard',
            ...common.data,
            compounds: setup.compounds,
            doubleHelices: setup.doubleHelices,
            baseInteractions: setup.baseInteractions,
            ntcs: new NtC.NtCs(setup.ntcs, setup.ntcForceScaleFactor),
            mobilizers: [], // No mobilizers are allowed in simple job
            mdParameters: setup.md,
            advParams: new AdvancedParameters.Type(), // No advanced parameters
        },
    };
}

function standardAdvanced(setup: MmbSetup): Conversion.Result<Cmds.StandardParameters<ParameterNames>> {
    const common = makeCommonParams(setup);
    if (Conversion.isErrorResult(common))
        return common;

    return {
        type: 'ok',
        data: {
            jobType: 'standard',
            ...common.data,
            compounds: setup.compounds,
            doubleHelices: setup.doubleHelices,
            baseInteractions: setup.baseInteractions,
            ntcs: new NtC.NtCs(setup.ntcs, setup.ntcForceScaleFactor),
            mobilizers: setup.mobilizers,
            mdParameters: setup.md,
            advParams: new AdvancedParameters.Type(setup.advancedParameters),
        },
    };
}

function densityFit(setup: MmbSetup): Conversion.Result<Cmds.DensityFitParameters> {
    const errors = new Array<string>();

    const common = makeCommonParams(setup);
    if (Conversion.isErrorResult(common)) {
        return {
            type: 'error',
            errors: [...common.errors, ...errors],
        };
    }

    if (!setup.densityFitFiles.structure)
        errors.push('No structure file');
    if (!setup.densityFitFiles.densityMap)
        errors.push('No density map file');

    if (errors.length > 0)
        return { type: 'error', errors };

    const structure = setup.densityFitFiles.structure!.name;
    const densityMap = setup.densityFitFiles.densityMap!.name;

    return {
        type: 'ok',
        data: {
            jobType: 'density-fit',
            ...common.data,
            densityFitFiles: { structure, densityMap },
            compounds: setup.compounds,
            mobilizers: setup.mobilizers,
            ntcs: new NtC.NtCs(setup.ntcs, setup.ntcForceScaleFactor),
            mdParameters: setup.md,
        },
    };
}

export type RetType = Conversion.Result<Cmds.StandardParameters<ParameterNames>|Cmds.DensityFitParameters>;
export function toParameters(setup: MmbSetup, mode: Mmb.SyntheticModes): RetType {
    switch (mode) {
    case 'standard-simple':
        return standardSimple(setup);
    case 'standard-advanced':
        return standardAdvanced(setup);
    case 'density-fit':
        return densityFit(setup);
    }
}

}
