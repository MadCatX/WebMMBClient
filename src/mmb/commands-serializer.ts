/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Commands } from './commands';
import { Parameters } from '../mmb/available-parameters';
import { AdvancedParameters } from '../model/mmb/advanced-parameters';
import { BaseInteraction } from '../model/mmb/base-interaction';
import { Compound } from '../model/mmb/compound';
import { DoubleHelix } from '../model/mmb/double-helix';
import { GlobalConfig } from '../model/mmb/global-config';
import { MdParameters } from '../model/mmb/md-parameters';
import { Mobilizer } from '../model/mmb/mobilizer';
import { NtC } from '../model/mmb/ntc';
import { Reporting } from '../model/mmb/reporting';
import { Num } from '../util/num';
import * as Api from './api';
import * as AO from './api-objs';

export namespace TextCommandsSerializer {
    function advancedParameters<K extends (string extends K ? never : string)>(advParams: AdvancedParameters.Type) {
        const ret = ['', '# Advanced parameters'];

        for (const [name, value] of advParams.entries()) {
            const param = Parameters.get(name);
            if (!param)
                throw new Error(`Parameter ${name} does not exist`);

            if (param.getType() === 'boolean')
                ret.push(`${name} ${trueFalse(value as boolean)}`);
            else {
                const txt = value === undefined ? '<NO VALUE>' : value;
                ret.push(`${name} ${txt}`);
            }
        }

        return ret;
    }

    function global(config: GlobalConfig) {
        return ['',
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
        return ['',
            '# Reporting',
            `reportingInterval ${rep.interval}`,
            `numReportingIntervals ${rep.count}`];
    }

    function stage(stage: number) {
        return ['',
            '# Stages',
            `firstStage ${stage}`,
            `lastStage ${stage}`];
    }

    function serializeDensityFit(params: Commands.DensityFitParameters, commands: string[]) {
        commands.push(`loadSequencesFromPdb ${params.densityFitFiles.structure}`);
        commands.push(`densityFileName ${params.densityFitFiles.densityMap}`);
        commands.push('fitToDensity');

        return commands;
    }

    function serializeStandard<K extends (string extends K ? never : string)>(params: Commands.StandardParameters<K>, commands: string[]) {
        // Write MD parameters
        commands = commands.concat(mdParams(params.mdParameters));

        // Write advanced parameters
        commands = commands.concat(advancedParameters(params.advParams));

        // Write sequences
        commands.push('', '# Sequences');
        params.compounds.forEach(c => {
            const entry = `${c.type.toLocaleUpperCase()} ${c.chain.name} ${c.firstResidue.authNumber} ${Compound.sequenceAsString(c.sequence)}`;
            commands.push(entry);
        });

        // Double helices
        commands.push('', '# Double helices');
        params.doubleHelices.forEach(dh => {
            const cA = params.compounds.find(c => c.chain.name === dh.chainNameA)!;
            const cB = params.compounds.find(c => c.chain.name === dh.chainNameB)!;
            const entry = `nucleicAcidDuplex ${cA.chain.authName} ${cA.residueByNumber(dh.firstResNoA)!.authNumber} ${cA.residueByNumber(dh.lastResNoA)} ${cB.chain.authName} ${cB.residueByNumber(dh.firstResNoB)!.authNumber} ${cB.residueByNumber(dh.lastResNoB)!.authNumber}`;
            commands.push(entry);
        });

        // Base interactions
        commands.push('', '# Base interactions');
        params.baseInteractions.forEach(bi => {
            const cA = params.compounds.find(c => c.chain.name === bi.chainNameA)!;
            const cB = params.compounds.find(c => c.chain.name === bi.chainNameB)!;
            const entry = `baseInteraction ${cA.chain.authName} ${cA.residueByNumber(bi.resNoB)!.authNumber} ${bi.edgeA} ${cB.chain.authName} ${cB.residueByNumber(bi.resNoB)} ${bi.edgeB} ${bi.orientation}`;
            commands.push(entry);
        });

        // NtCs
        commands.push('', '# NtCs');
        if (params.ntcs.conformations.length > 0) {
            params.ntcs.conformations.forEach(ntc => {
                const c = params.compounds.find(c => c.chain.name === ntc.chainName)!;
                const entry  = `NtC ${c.chain.authName} ${c.residueByNumber(ntc.firstResNo)!.authNumber} ${c.residueByNumber(ntc.lastResNo)!.authNumber} ${ntc.ntc} 1.5`;
                commands.push(entry);
            });
            commands.push(`NtCForceScaleFactor ${params.ntcs.forceScaleFactor}`);
        }

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

    export function serialize<K extends (string extends K ? never : string)>(params: Commands.DensityFitParameters|Commands.StandardParameters<K>) {
        let commands: string[] = [];
        commands = commands.concat(stage(params.stage));
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

    export function trueFalse(b: boolean) {
        return b ? 'True' : 'False';
    }
}

export namespace JsonCommandsSerializer {
    function advancedParameters(advParams: AdvancedParameters.Type) {
        const defs: Api.JsonAdvancedParameters = {};

        for (const [name, value] of advParams.entries()) {
            const param = Parameters.get(name);
            if (!param)
                throw new Error(`Parameter ${name} does not exist`);

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
            const cA = compounds.find(c => c.chain.name === bi.chainNameA)!;
            const cB = compounds.find(c => c.chain.name === bi.chainNameB)!;
            defs.push(
                {
                    chain_name_1: cA.chain.name,
                    res_no_1: bi.resNoA,
                    edge_1: bi.edgeB,
                    chain_name_2: cB.chain.name,
                    res_no_2: bi.resNoB,
                    edge_2: bi.edgeB,
                    orientation: bi.orientation,
                }
            );
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
                residues: c.residues.map(res => ({ number: res.number, auth_number: res.authNumber }) ),
            });
        }

        return defs;
    }

    function doubleHelices(dhs: DoubleHelix[], compounds: Compound[]) {
        const defs: Api.DoubleHelix[] = [];

        dhs.forEach(dh => {
            const cA = compounds.find(c => c.chain.name === dh.chainNameA)!;
            const cB = compounds.find(c => c.chain.name === dh.chainNameB)!;
            const def = {
                chain_name_1: cA.chain.name, first_res_no_1: dh.firstResNoA, last_res_no_1: dh.lastResNoA,
                chain_name_2: cB.chain.name, first_res_no_2: dh.firstResNoB, last_res_no_2: dh.lastResNoB,
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

    function ntcs(ntcs: NtC.NtCs, compounds: Compound[]) {
        const defs: Api.NtCs = Object.assign({}, AO.NtCs);
        defs.conformations = new Array<Api.NtCConformation>();

        ntcs.conformations.forEach(ntc => {
            const c = compounds.find(c => c.chain.name === ntc.chainName)!;
            const def = {
                chain_name: c.chain.name,
                first_res_no: ntc.firstResNo,
                last_res_no: ntc.lastResNo,
                ntc: ntc.ntc,
                weight: 1.5, // Temporary
            };
            defs.conformations.push(def);
        });
        defs.force_scale_factor = ntcs.forceScaleFactor;

        return defs;
    }

    function serializeDensityFit(params: Commands.DensityFitParameters) {
        let cmds = Object.assign({}, AO.DensityFitCommands);

        cmds.structure_file_name = params.densityFitFiles.structure;
        cmds.density_map_file_name = params.densityFitFiles.densityMap;
        cmds.compounds = compounds(params.compounds);
        cmds.mobilizers = mobilizers(params.mobilizers, params.compounds);
        cmds.ntcs = ntcs(params.ntcs, params.compounds);
        cmds.stage = params.stage;

        cmds = mdParams(cmds, params.mdParameters);

        return cmds;
    }

    function serializeStandard<K extends (string extends K ? never : string)>(params: Commands.StandardParameters<K>) {
        let cmds = Object.assign({}, AO.StandardCommands);

        // Global
        cmds.base_interaction_scale_factor = params.global.baseInteractionScaleFactor;
        cmds.stage = params.stage;
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

    export function serialize<K extends (string extends K ? never : string)>(params: Commands.DensityFitParameters|Commands.StandardParameters<K>) {
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

        // Reporting
        cmds.reporting_interval = params.reporting.interval;
        cmds.num_reporting_intervals = params.reporting.count;

        // Global params
        cmds.base_interaction_scale_factor = params.global.baseInteractionScaleFactor;
        cmds.temperature = params.global.temperature;

        return cmds as Api.DensityFitCommands|Api.StandardCommands;
    }
}
