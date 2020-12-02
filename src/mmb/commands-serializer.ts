/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { JsonCommands } from './commands';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { GlobalConfig } from '../model/global-config';
import { MdParameters } from '../model/md-parameters';
import { NtCConformation } from '../model/ntc-conformation';
import { Reporting } from '../model/reporting';
import { StagesSpan } from '../model/stages-span';

export namespace CommandsSerializer {
    export type Parameters = {
        baseInteractions: BaseInteraction[],
        global: GlobalConfig,
        compounds: Compound[],
        doubleHelices: DoubleHelix[],
        mdParameters: MdParameters,
        ntcs: NtCConformation[],
        reporting: Reporting,
        stages: StagesSpan,
    }

    export function trueFalse(b: boolean) {
        return b ? 'True' : 'False';
    }
}

export namespace TextCommandsSerializer {
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

    export function serialize(params: CommandsSerializer.Parameters) {
        let commands: string[] = [];

        // Write general config
        commands = commands.concat(global(params.global));

        // Write stages
        commands = commands.concat(stages(params.stages));

        // Write reporting
        commands = commands.concat(reporting(params.reporting));

        // Write MD parameters
        commands = commands.concat(mdParams(params.mdParameters));

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
    };

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

    export function serialize(params: CommandsSerializer.Parameters) {
        let cmds = Object.assign({}, Commands);

        // Global
        cmds.baseInteractionScaleFactor = [params.global.baseInteractionScaleFactor.toString()];
        cmds.useMultithreadedComputation = [CommandsSerializer.trueFalse(params.global.useMultithreading)];
        cmds.temperature = [params.global.temperature.toString()];

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

        return cmds;
    }
}
