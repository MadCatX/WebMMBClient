import { GlobalConfig } from './global-config';
import { MdParameters } from './md-parameters';
import { MmbSetup } from './mmb-setup';
import { NtC } from './ntc';
import { Reporting } from './reporting';
import { StagesSpan } from './stages-span';
import { FileInputParameterNames } from '../../mmb/available-parameters';

function isDensityFitSetupStartable(setup: MmbSetup) {
    const errors = new Array<string>();

    const dfFiles = setup.densityFitFiles;
    if (!dfFiles.structure)
        errors.push('No structure file');
    else if (!dfFiles.structure.isUploaded)
        errors.push('Structure file is not uploaded');

    if (!dfFiles.densityMap)
        errors.push('No density map file');
    else if (!dfFiles.densityMap.isUploaded)
        errors.push('Density map file is not uploaded');

    if (setup.compounds.length < 1)
        errors.push('No compounds');

    return errors.length > 0 ? errors : void 0;
}

function isStandardSetupStartable(setup: MmbSetup) {
    const errors = new Array<string>();

    if (setup.compounds.length < 1)
        errors.push('Setup has no compounds');

    const avail = setup.stages;
    if (setup.stage < avail.first || setup.stage > avail.last + 1 || setup.stage < 1)
        errors.push('Stage number is out of range');

    const advParams = setup.advancedParameters;
    const addFiles = setup.additionalFiles;
    for (const [key, value] of advParams) {
        if (value === undefined) {
            errors.push(`Advanced parameter ${key} must have a value`);
            continue;
        }
        if (FileInputParameterNames.includes(key)) {
            const f = addFiles.find(i => (i.name === value && i.isUploaded));
            if (!f)
                errors.push(`File ${value} for parameter ${key} is not uploaded`);
        }
    }

    return errors.length > 0 ? errors : void 0;
}

export namespace Mmb {
    export type SyntheticModes = 'standard-simple' | 'standard-advanced' | 'density-fit';
    export type RawModes = 'maverick';
    export function isSyntheticMode(v: string): v is SyntheticModes {
        return v === 'standard-simple' || v === 'standard-advanced' || v === 'density-fit';
    }
    export function isRawMode(v: string): v is RawModes {
        return v === 'maverick';
    }

    export function isSetupStartable(setup: MmbSetup, mode: Mmb.SyntheticModes) {
        switch (mode) {
        case 'standard-simple':
        case 'standard-advanced':
            return isStandardSetupStartable(setup);
        case 'density-fit':
            return isDensityFitSetupStartable(setup);
        }
    }

    export function setDefaultSetup(setup: MmbSetup) {
        const fresh = MmbSetup.emptyData();

        fresh.global.baseInteractionScaleFactor = GlobalConfig.Defaults.baseInteractionScaleFactor;
        fresh.global.temperature = GlobalConfig.Defaults.temperature;
        fresh.md.useDefaults = MdParameters.Defaults.useDefaults;
        fresh.ntcForceScaleFactor = NtC.DefaultForceScaleFactor;
        fresh.reporting.interval = Reporting.Defaults.interval;
        fresh.reporting.count = Reporting.Defaults.count;
        fresh.stage = 0;
        fresh.stages = new StagesSpan(0, 0);

        if (setup.reset(fresh))
            throw new Error('Failed to set defaults for MmbSetup. This is a bug');
    }
}
