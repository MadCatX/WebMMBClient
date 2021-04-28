/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { JsonAdvancedParameters, JsonCommands, MobilizerParameter } from './commands';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { GlobalConfig } from '../model/global-config';
import { MdParameters } from '../model/md-parameters';
import { Mobilizer } from '../model/mobilizer';
import { NtCConformation } from '../model/ntc-conformation';
import { Parameter as P } from '../model/parameter';
import { Reporting } from '../model/reporting';
import { StagesSpan } from '../model/stages-span';
import { Num } from '../util/num';

export namespace CommandsSerializer {
    export type AdvancedParameters<K extends (string extends K ? never : string)> = {
        parameters: ReadonlyMap<K, P.Parameter<K>>,
        values: Map<K, unknown>,
    }

    export type Parameters<K extends (string extends K ? never : string)> = {
        baseInteractions: BaseInteraction[],
        global: GlobalConfig,
        compounds: Compound[],
        doubleHelices: DoubleHelix[],
        mdParameters: MdParameters,
        ntcs: NtCConformation[],
        mobilizers: Mobilizer[],
        reporting: Reporting,
        stages: StagesSpan,
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

            if (P.isBoolean(param))
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
            `useMultithreadedComputation ${CommandsSerializer.trueFalse(config.useMultithreading)}`,
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

    export function serialize<K extends (string extends K ? never : string)>(params: CommandsSerializer.Parameters<K>) {
        let commands: string[] = [];

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
            let entry = m.bondMobility;
            if (m.chain !== undefined)
                entry += ` ${m.chain}`;
            if (m.residueSpan !== undefined)
                entry += ` ${m.residueSpan.first} ${m.residueSpan.last}`;
            commands.push(entry);
        });

        return commands;
    }
}

export namespace JsonCommandsSerializer {
    const Commands: JsonCommands = {
        baseInteractionScaleFactor: [],
        useMultithreadedComputation: [],
        temperature: [],
        firstStage: [],
        lastStage: [],
        reportingInterval: [],
        numReportingIntervals: [],
        sequences: [],
        doubleHelices: [],
        baseInteractions: [],
        ntcs: [],
        mobilizers: [],
        advParams: {} as JsonAdvancedParameters,
    };

    function advancedParameters<K extends (string extends K ? never : string)>(advParams: CommandsSerializer.AdvancedParameters<K>) {
        let defs = {} as JsonAdvancedParameters;

        for (const [name, value] of advParams.values.entries()) {
            const param = advParams.parameters.get(name)!;

            if (P.isIntegral(param)) {
                defs[name] = Num.parseIntStrict(value);
            } else if (P.isReal(param)) {
                defs[name] = Num.parseFloatStrict(value);
            } else if (P.isBoolean(param)) {
                defs[name] = value as boolean;
            } else
                defs[name] = value as string;
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

    function mdParams(cmds: JsonCommands, md: MdParameters) {
        if (md.useDefaults) {
            const empty: null[] = [];
            return Object.assign(cmds, { setDefaultMDParameters: empty });
        }
        return cmds;
    }

    function mobilizers(mobilizers: Mobilizer[]) {
        const defs = new Array<MobilizerParameter>();

        mobilizers.forEach(m => {
            const def: MobilizerParameter = { bondMobility: m.bondMobility };
            if (m.chain !== undefined) {
                def.chain = m.chain;

                if (m.residueSpan !== undefined) {
                    def.firstResidue = m.residueSpan.first;
                    def.firstResidue = m.residueSpan.last;
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

    export function serialize<K extends (string extends K ? never : string)>(params: CommandsSerializer.Parameters<K>) {
        let cmds = Object.assign({}, Commands);

        // Global
        cmds.baseInteractionScaleFactor = [params.global.baseInteractionScaleFactor.toString()];
        cmds.useMultithreadedComputation = [CommandsSerializer.trueFalse(params.global.useMultithreading)];
        cmds.temperature = [params.global.temperature.toString()];

        // Advanced
        cmds.advParams = advancedParameters(params.advParams);

        // Stages
        cmds.firstStage = [params.stages.first.toString()];
        cmds.lastStage = [params.stages.last.toString()];

        // Reporting
        cmds.reportingInterval = [params.reporting.interval.toString()];
        cmds.numReportingIntervals = [params.reporting.count.toString()];

        cmds = mdParams(cmds, params.mdParameters);

        cmds.sequences = sequences(params.compounds);
        cmds.doubleHelices = doubleHelices(params.doubleHelices);
        cmds.baseInteractions = baseInteractions(params.baseInteractions);
        cmds.ntcs = ntcs(params.ntcs);
        cmds.mobilizers = mobilizers(params.mobilizers);

        return cmds;
    }
}
