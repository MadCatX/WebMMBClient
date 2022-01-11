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
import { NtCs } from '../model/ntc-conformation';
import { Parameter as P } from '../model/parameter';
import { Reporting } from '../model/reporting';
import { StagesSpan } from '../model/stages-span';
import { Num } from '../util/num';
import * as Api from './api';
import * as AO from './api-objs';

export namespace CommandsSerializer {
    export type AdvancedParameters<K extends (string extends K ? never : string)> = {
        parameters: ReadonlyMap<K, P.Parameter<K>>,
        values: Map<K, unknown>,
    }

    export type CommonParameters = {
        reporting: Reporting,
        stages: StagesSpan,
        global: GlobalConfig,
    }

    export type DensityFitParameters = CommonParameters & {
        jobType: 'density-fit',
        densityFitFiles: DensityFitFiles,
        compounds: Compound[],
        mobilizers: Mobilizer[],
        ntcs: NtCs,
        mdParameters: MdParameters,
    }

    export type StandardParameters<K extends (string extends K ? never : string)> = CommonParameters & {
        jobType: 'standard';
        baseInteractions: BaseInteraction[],
        compounds: Compound[],
        doubleHelices: DoubleHelix[],
        mdParameters: MdParameters,
        ntcs: NtCs,
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
        commands.push(`loadSequencesFromPdb ${params.densityFitFiles.structureFileName}`);
        commands.push(`densityFileName ${params.densityFitFiles.densityMapFileName}`);
        commands.push('fitToDensity');

        return commands;
    }

    function serializeStandard<K extends (string extends K ? never : string)>(params: CommandsSerializer.StandardParameters<K>, commands: string[]) {
        // Write general config
        commands = commands.concat(global(params.global));

        // Write MD parameters
        commands = commands.concat(mdParams(params.mdParameters));

        // Write advanced parameters
        commands = commands.concat(advancedParameters(params.advParams));

        // Write sequences
        commands.push('', '# Sequences');
        params.compounds.forEach(c => {
            const entry = `${c.type.toLocaleUpperCase()} ${c.chain.name} ${c.firstResidue().authNumber} ${Compound.sequenceAsString(c.sequence)}`;
            commands.push(entry);
        });

        // Double helices
        commands.push('', '# Double helices');
        params.doubleHelices.forEach(dh => {
            const cOne = params.compounds.find(c => c.chain.name === dh.chainNameOne)!;
            const cTwo = params.compounds.find(c => c.chain.name === dh.chainNameTwo)!;
            const entry = `nucleicAcidDuplex ${cOne.chain.authName} ${cOne.residueByNumber(dh.firstResidueNoOne)!.authNumber} ${cOne.residueByNumber(dh.lastResidueNoOne)} ${cTwo.chain.authName} ${cTwo.residueByNumber(dh.firstResidueNoTwo)!.authNumber} ${cTwo.residueByNumber(dh.lastResidueNoTwo)!.authNumber}`;
            commands.push(entry);
        });

        // Base interactions
        commands.push('', '# Base interactions');
        params.baseInteractions.forEach(bi => {
            const cOne = params.compounds.find(c => c.chain.name === bi.chainNameOne)!;
            const cTwo = params.compounds.find(c => c.chain.name === bi.chainNameTwo)!;
            const entry = `baseInteraction ${cOne.chain.authName} ${cOne.residueByNumber(bi.residueNoTwo)!.authNumber} ${bi.edgeOne} ${cTwo.chain.authName} ${cTwo.residueByNumber(bi.residueNoTwo)} ${bi.edgeTwo} ${bi.orientation}`;
            commands.push(entry);
        });

        // NtCs
        commands.push('', '# NtCs');
        params.ntcs.conformations.forEach((ntc) => {
            const c = params.compounds.find(c => c.chain.name === ntc.chainName)!;
            const entry  = `NtC ${c.chain.authName} ${c.residueByNumber(ntc.firstResidueNo)!.authNumber} ${c.residueByNumber(ntc.lastResidueNo)!.authNumber} ${ntc.ntc} 1.5`;
            commands.push(entry);
        });
        commands.push(`NtCForceScaleFactor ${params.ntcs.forceScaleFactor}`);

        // Mobilizers
        commands.push('', '# Mobilizers');
        params.mobilizers.forEach(m => {
            let entry = `mobilizer ${m.bondMobility}`;
            if (m.chainName !== undefined) {
                const c = params.compounds.find(c => c.chain.name === m.chainName)!;
                entry += ` ${c.chain.authName}`;
                if (m.residueSpan !== undefined)
                    entry += ` ${c.residueByNumber(m.residueSpan.first)!.authNumber} ${c.residueByNumber(m.residueSpan.last)!.authNumber}`;
            }
            commands.push(entry);
        });

        return commands;

    }

    export function serialize<K extends (string extends K ? never : string)>(params: CommandsSerializer.DensityFitParameters|CommandsSerializer.StandardParameters<K>) {
        let commands: string[] = [];
        commands = commands.concat(stages(params.stages));
        commands = commands.concat(reporting(params.reporting));
        commands = commands.concat(global(params.global));

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
        const defs: Api.JsonAdvancedParameters = {};

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

    function baseInteractions(bis: BaseInteraction[], compounds: Compound[]) {
        const defs: Api.BaseInteraction[] = [];

        bis.forEach(bi => {
            const cOne = compounds.find(c => c.chain.name === bi.chainNameOne)!;
            const cTwo = compounds.find(c => c.chain.name === bi.chainNameTwo)!;
            const def: Api.BaseInteraction = {
                chain_name_1: cOne.chain.name,
                res_no_1: bi.residueNoOne,
                edge_1: bi.edgeTwo,
                chain_name_2: cTwo.chain.name,
                res_no_2: bi.residueNoTwo,
                edge_2: bi.edgeTwo,
                orientation: bi.orientation,
            }
            defs.push(def);
        });

        return defs;
    }

    function compounds(comps: Compound[]) {
        const defs: Api.Compound[] = [];

        for (const c of comps) {
            defs.push({
                chain: { name: c.chain.name, auth_name: c.chain.authName },
                ctype: c.type === 'DNA' ? 'DNA' : c.type === 'RNA' ? 'RNA' : 'Protein',
                sequence: Compound.sequenceAsString(c.sequence),
                residues: c.residues.map(res => { return { number: res.number, auth_number: res.authNumber }; }),
            });
        }

        return defs;
    }

    function doubleHelices(dhs: DoubleHelix[], compounds: Compound[]) {
        const defs: Api.DoubleHelix[] = [];

        dhs.forEach(dh => {
            const cOne = compounds.find(c => c.chain.name === dh.chainNameOne)!;
            const cTwo = compounds.find(c => c.chain.name === dh.chainNameTwo)!;
            const def = {
                chain_name_1: cOne.chain.name, first_res_no_1: dh.firstResidueNoOne, last_res_no_1: dh.lastResidueNoOne,
                chain_name_2: cTwo.chain.name, first_res_no_2: dh.firstResidueNoTwo, last_res_no_2: dh.lastResidueNoTwo,
            };
            defs.push(def);
        });

        return defs;
    }

    function mdParams<C extends Api.DensityFitCommands|Api.StandardCommands>(cmds: C, md: MdParameters): C {
        cmds.set_default_MD_parameters = md.useDefaults;
        return cmds;
    }

    function mobilizers(mobilizers: Mobilizer[], compounds: Compound[]) {
        const defs = new Array<Api.Mobilizer>();

        mobilizers.forEach(m => {
            const def: Api.Mobilizer = { bond_mobility: m.bondMobility };
            if (m.chainName !== undefined) {
                const c = compounds.find(c => c.chain.name === m.chainName)!;
                def.chain = c.chain.name;

                if (m.residueSpan !== undefined) {
                    def.first_residue = m.residueSpan.first;
                    def.last_residue = m.residueSpan.last;
                }
            }

            defs.push(def);
        });

        return defs;
    }

    function ntcs(ntcs: NtCs, compounds: Compound[]) {
        const defs: Api.NtCs = Object.assign({}, AO.NtCs);
        defs.conformations = new Array<Api.NtCConformation>();

        ntcs.conformations.forEach(ntc => {
            const c = compounds.find(c => c.chain.name === ntc.chainName)!;
            const def = {
                chain_name: c.chain.name,
                first_res_no: ntc.firstResidueNo,
                last_res_no: ntc.lastResidueNo,
                ntc: ntc.ntc,
                weight: 1.5, // Temporary
            };
            defs.conformations.push(def);
        });
        defs.force_scale_factor = ntcs.forceScaleFactor;

        return defs;
    }

    function serializeDensityFit(params: CommandsSerializer.DensityFitParameters) {
        let cmds = Object.assign({}, AO.DensityFitCommands);

        cmds.structure_file_name = params.densityFitFiles.structureFileName;
        cmds.density_map_file_name = params.densityFitFiles.densityMapFileName;
        cmds.compounds = compounds(params.compounds);
        cmds.mobilizers = mobilizers(params.mobilizers, params.compounds);
        cmds.ntcs = ntcs(params.ntcs, params.compounds);

        cmds = mdParams(cmds, params.mdParameters);

        return cmds;
    }

    function serializeStandard<K extends (string extends K ? never : string)>(params: CommandsSerializer.StandardParameters<K>) {
        let cmds = Object.assign({}, AO.StandardCommands);

        // Global
        cmds.base_interaction_scale_factor = params.global.baseInteractionScaleFactor;
        cmds.temperature = params.global.temperature;

        cmds = mdParams(cmds, params.mdParameters);

        cmds.compounds = compounds(params.compounds);
        cmds.double_helices = doubleHelices(params.doubleHelices, params.compounds);
        cmds.base_interactions = baseInteractions(params.baseInteractions, params.compounds);
        cmds.ntcs = ntcs(params.ntcs, params.compounds);
        cmds.mobilizers = mobilizers(params.mobilizers, params.compounds);

        // Advanced
        cmds.adv_params = advancedParameters(params.advParams);

        return cmds;
    }

    export function serialize<K extends (string extends K ? never : string)>(params: CommandsSerializer.DensityFitParameters|CommandsSerializer.StandardParameters<K>) {
        let cmds = Object.assign({}, AO.CommonCommands);

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

        // Global params
        cmds.base_interaction_scale_factor = params.global.baseInteractionScaleFactor;
        cmds.temperature = params.global.temperature;

        return cmds as Api.DensityFitCommands|Api.StandardCommands;
    }
}
