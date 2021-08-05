/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DensityFitFiles } from '../model/density-fit-files';
import { DoubleHelix } from '../model/double-helix';
import { GlobalConfig } from '../model/global-config';
import { MdParameters } from '../model/md-parameters';
import { Mobilizer } from '../model/mobilizer';
import { NtCConformation } from '../model/ntc-conformation';
import { Parameter as P } from '../model/parameter';
import { Reporting } from '../model/reporting';
import { StagesSpan } from '../model/stages-span';
import { Num } from '../util/num';
import * as Api from './api';
import { CommonCommands, DensityFitCommands, StandardCommands } from './api-objs';

export namespace CommandsSerializer {
    export type AdvancedParameters<K extends (string extends K ? never : string)> = {
        parameters: ReadonlyMap<K, P.Parameter<K>>,
        values: Map<K, unknown>,
    }

    export type CommonParameters = {
        reporting: Reporting,
        stages: StagesSpan,
    }

    export type DensityFitParameters = CommonParameters & {
        jobType: 'density-fit',
        densityFitFiles: DensityFitFiles,
    }

    export type StandardParameters<K extends (string extends K ? never : string)> = CommonParameters & {
        jobType: 'standard';
        baseInteractions: BaseInteraction[],
        global: GlobalConfig,
        compounds: Compound[],
        doubleHelices: DoubleHelix[],
        mdParameters: MdParameters,
        ntcs: NtCConformation[],
        mobilizers: Mobilizer[],
        advParams: AdvancedParameters<K>,
    }

    export function trueFalse(b: boolean) {
        return b ? 'True' : 'False';
    }
}

export namespace TextCommandsSerializer {
    function advancedParameters<K extends (string extends K ? never : string)>(advParams: CommandsSerializer.AdvancedParameters<K>) {
        const ret = [ '', '# Advanced parameters'];

        for (const [name, value] of advParams.values.entries()) {
            const param = advParams.parameters.get(name)!;

            if (param.getType() === 'boolean')
                ret.push(`${name} ${CommandsSerializer.trueFalse(value as boolean)}`);
            else
                ret.push(`${name} ${value}`);
        }

        return ret;
    }

    function global(config: GlobalConfig) {
        return [ '',
            '# Common configuration',
            `baseInteractionScaleFactor ${config.baseInteractionScaleFactor}`,
            `temperature ${config.temperature}`];
    }

    function mdParams(md: MdParameters) {
        const ret = ['', '# MD Parameters'];

        if (md.useDefaults)
            ret.push('setDefaultMDParameters');

        return ret;
    }

    function reporting(rep: Reporting) {
        return [ '',
            '# Reporting',
            `reportingInterval ${rep.interval}`,
            `numReportingIntervals ${rep.count}`];
    }

    function stages(stages: StagesSpan) {
        return [ '',
            '# Stages',
            `firstStage ${stages.first}`,
            `lastStage ${stages.last}`];
    }

    function serializeDensityFit(params: CommandsSerializer.DensityFitParameters, commands: string[]) {
        commands.push(`loadSequenceFromPdb ${params.densityFitFiles.structureFileName}`);
        commands.push(`densityFileMap ${params.densityFitFiles.densityMapFileName}`);

        return commands;
    }

    function serializeStandard<K extends (string extends K ? never : string)>(params: CommandsSerializer.StandardParameters<K>, commands: string[]) {
        // Write general config
        commands = commands.concat(global(params.global));

        // Write stages
        commands = commands.concat(stages(params.stages));

        // Write reporting
        commands = commands.concat(reporting(params.reporting));

        // Write MD parameters
        commands = commands.concat(mdParams(params.mdParameters));

        // Write advanced parameters
        commands = commands.concat(advancedParameters(params.advParams));

        // Write sequences
        commands.push('', '# Sequences');
        params.compounds.forEach((c) => {
            const entry = `${c.type.toLocaleUpperCase()} ${c.chain} ${c.firstResidueNo} ${Compound.sequenceAsString(c.sequence)}`;
            commands.push(entry);
        });

        // Double helices
        commands.push('', '# Double helices');
        params.doubleHelices.forEach((dh) => {
            const entry = `nucleicAcidDuplex ${dh.chainOne} ${dh.firstResidueNoOne} ${dh.lastResidueNoOne} ${dh.chainTwo} ${dh.firstResidueNoTwo} ${dh.lastResidueNoTwo}`;
            commands.push(entry);
        });

        // Base interactions
        commands.push('', '# Base interactions');
        params.baseInteractions.forEach((bi) => {
            const entry = `baseInteraction ${bi.chainOne} ${bi.residueOne} ${bi.edgeOne} ${bi.chainTwo} ${bi.residueTwo} ${bi.edgeTwo} ${bi.orientation}`;
            commands.push(entry);
        });

        // NtCs
        commands.push('', '# NtCs');
        params.ntcs.forEach((ntc) => {
            const entry  = `NtC ${ntc.chain} ${ntc.firstResidueNo} ${ntc.lastResidueNo} ${ntc.ntc} 1.5`;
            commands.push(entry);
        });

        // Mobilizers
        commands.push('', '# Mobilizers');
        params.mobilizers.forEach(m => {
            let entry = `mobilizer ${m.bondMobility}`;
            if (m.chain !== undefined)
                entry += ` ${m.chain}`;
            if (m.residueSpan !== undefined)
                entry += ` ${m.residueSpan.first} ${m.residueSpan.last}`;
            commands.push(entry);
        });

        return commands;

    }

    export function serialize<K extends (string extends K ? never : string)>(params: CommandsSerializer.DensityFitParameters|CommandsSerializer.StandardParameters<K>) {
        let commands: string[] = [];
        // Write stages
        commands = commands.concat(stages(params.stages));

        // Write reporting
        commands = commands.concat(reporting(params.reporting));

        switch (params.jobType) {
        case 'density-fit':
            commands = serializeDensityFit(params, commands);
            break;
        case 'standard':
            commands = serializeStandard(params, commands);
            break;
        }

        return commands;
    }
}

export namespace JsonCommandsSerializer {
    function advancedParameters<K extends (string extends K ? never : string)>(advParams: CommandsSerializer.AdvancedParameters<K>) {
        let defs: Api.JsonAdvancedParameters = {};

        for (const [name, value] of advParams.values.entries()) {
            const param = advParams.parameters.get(name)!;

            switch (param.getType()) {
                case 'integral':
                    defs[name] = Num.parseIntStrict(value);
                    break;
                case 'real':
                    defs[name] = Num.parseFloatStrict(value);
                    break;
                case 'boolean':
                    defs[name] = value as boolean;
                    break;
                case 'options':
                    defs[name] = value as string;
                    break;
                default:
                    throw new Error('Unknown advanced parameter type');
            }
        }

        return defs;
    }

    function baseInteractions(bis: BaseInteraction[]) {
        const defs: string[] = [];

        bis.forEach((bi) => {
            defs.push(`baseInteraction ${bi.chainOne} ${bi.residueOne} ${bi.edgeOne} ${bi.chainTwo} ${bi.residueTwo} ${bi.edgeTwo} ${bi.orientation}`);
        });

        return defs;
    }

    function doubleHelices(dhs: DoubleHelix[]) {
        const defs: string[] = [];

        dhs.forEach((dh) => {
            defs.push(`nucleicAcidDuplex ${dh.chainOne} ${dh.firstResidueNoOne} ${dh.lastResidueNoOne} ${dh.chainTwo} ${dh.firstResidueNoTwo} ${dh.lastResidueNoTwo}`);
        });

        return defs;
    }

    function mdParams(cmds: Api.StandardCommands, md: MdParameters) {
        cmds.set_default_MD_parameters = md.useDefaults;
        return cmds;
    }

    function mobilizers(mobilizers: Mobilizer[]) {
        const defs = new Array<Api.MobilizerParameter>();

        mobilizers.forEach(m => {
            const def: Api.MobilizerParameter = { bond_mobility: m.bondMobility };
            if (m.chain !== undefined) {
                def.chain = m.chain;

                if (m.residueSpan !== undefined) {
                    def.first_residue = m.residueSpan.first;
                    def.last_residue = m.residueSpan.last;
                }
            }

            defs.push(def);
        });

        return defs;
    }

    function ntcs(ntcs: NtCConformation[]) {
        const defs: string[] = [];

        ntcs.forEach((ntc) => {
            defs.push(`NtC ${ntc.chain} ${ntc.firstResidueNo} ${ntc.lastResidueNo} ${ntc.ntc} 1.5`);
        });

        return defs;
    }

    function sequences(compounds: Compound[]) {
        const defs: string[] = [];

        compounds.forEach((c) => {
            defs.push(`${c.type.toLocaleUpperCase()} ${c.chain} ${c.firstResidueNo} ${Compound.sequenceAsString(c.sequence)}`);
        });

        return defs;
    }

    function serializeDensityFit(params: CommandsSerializer.DensityFitParameters) {
        let cmds = Object.assign({}, DensityFitCommands);

        cmds.structure_file_name = params.densityFitFiles.structureFileName;
        cmds.density_map_file_name = params.densityFitFiles.densityMapFileName;

        return cmds;
    }

    function serializeStandard<K extends (string extends K ? never : string)>(params: CommandsSerializer.StandardParameters<K>) {
        let cmds = Object.assign({}, StandardCommands);

        // Global
        cmds.base_interaction_scale_factor = params.global.baseInteractionScaleFactor;
        cmds.temperature = params.global.temperature;

        cmds = mdParams(cmds, params.mdParameters);

        cmds.sequences = sequences(params.compounds);
        cmds.double_helices = doubleHelices(params.doubleHelices);
        cmds.base_interactions = baseInteractions(params.baseInteractions);
        cmds.ntcs = ntcs(params.ntcs);
        cmds.mobilizers = mobilizers(params.mobilizers);

        // Advanced
        cmds.adv_params = advancedParameters(params.advParams);

        return cmds;
    }

    export function serialize<K extends (string extends K ? never : string)>(params: CommandsSerializer.DensityFitParameters|CommandsSerializer.StandardParameters<K>) {
        let cmds = Object.assign({}, CommonCommands);

        // Do concrete data first
        switch (params.jobType) {
        case 'density-fit':
            cmds = Object.assign(cmds, serializeDensityFit(params));
            break;
        case 'standard':
            cmds = Object.assign(cmds, serializeStandard(params));
            break;
        }

        // Stages
        cmds.first_stage = params.stages.first;
        cmds.last_stage = params.stages.last;

        // Reporting
        cmds.reporting_interval = params.reporting.interval;
        cmds.num_reporting_intervals = params.reporting.count;

        return cmds as Api.DensityFitCommands|Api.StandardCommands;
    }
}
