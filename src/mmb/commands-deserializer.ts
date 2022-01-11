/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for defails.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Parameters, ParameterNames } from '../mmb/available-parameters';
import { AdditionalFile } from '../model/additional-file';
import { BaseInteraction } from '../model/base-interaction';
import { Compound, ResidueNumber } from '../model/compound';
import { DensityFitFiles } from '../model/density-fit-files';
import { DoubleHelix } from '../model/double-helix';
import { GlobalConfig } from '../model/global-config';
import { MdParameters } from '../model/md-parameters';
import { Mobilizer, ResidueSpan } from '../model/mobilizer';
import { NtCConformation } from '../model/ntc-conformation';
import { Parameter as P } from '../model/parameter';
import { Reporting } from '../model/reporting';
import { StagesSpan } from '../model/stages-span';
import { Num } from '../util/num';
import * as Api from './api';

export namespace JsonCommandsDeserializer {
    function getChain(tok: string) {
        if (tok.length !== 1)
            throw new Error('Invalid chain ID');
        return tok;
    }

    export function toAdvancedParameters(commands: Api.StandardCommands, files: AdditionalFile[]): Api.JsonAdvancedParameters {
        const advParams = {} as Api.JsonAdvancedParameters;

        for (const key in commands.adv_params) {
            if (!Parameters.has(key as ParameterNames))
                throw new Error(`Advanced parameter ${key} does not exist`);

            const value = commands.adv_params[key];
            const param = Parameters.get(key as ParameterNames)!;

            if (P.isStatic(param)) {
                const arg = param.getArgument();
                if (P.isIntegralArg(arg)) {
                    const num = Num.parseIntStrict(value);
                    if (arg.isValid(num))
                        advParams[key] = num;
                    else
                        throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
                } else if (P.isRealArg(arg)) {
                    const num = Num.parseFloatStrict(value);
                    if (arg.isValid(num))
                        advParams[key] = num;
                    else
                        throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
                } else if (P.isBooleanArg(arg)) {
                    if (arg.chkType(value))
                        advParams[key] = value;
                    else
                        throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
                } else if (P.isTextualArg(arg)) {
                    if (arg.chkType(value))
                        advParams[key] = value;
                    else
                        throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
                } else if (P.isOptionsArg(arg)) {
                    if (arg.chkType(value))
                        advParams[key] = value;
                    else
                        throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
                }
            } else {
                if (key === 'densityFileName' ||
                    key === 'electroDensityFileName' ||
                    key === 'inQVectorFileName' ||
                    key === 'leontisWesthofInFileName' ||
                    key === 'tinkerParameterFileName') {
                    if (!files.find(f => f.name === value))
                        throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
                }
                advParams[key] = value;
            }
        }

        return advParams;
    }

    export function toBaseInteractions(commands: Api.StandardCommands) {
        const baseInteractions: BaseInteraction[] = [];

        for (const bi of commands.base_interactions) {
            baseInteractions.push(
                new BaseInteraction(
                    bi.chain_name_1, bi.res_no_1, bi.edge_1,
                    bi.chain_name_2, bi.res_no_2, bi.edge_2,
                    bi.orientation
                )
            );
        }

        return baseInteractions;
    }

    export function toDensityFitFiles(commands: Api.DensityFitCommands) {
        return new DensityFitFiles(
            commands.structure_file_name,
            commands.density_map_file_name
        );
    }

    export function toDoubleHelices(commands: Api.StandardCommands) {
        const doubleHelices: DoubleHelix[] = [];

        for (const dh of commands.double_helices) {

            doubleHelices.push(
                new DoubleHelix(
                    dh.chain_name_1, dh.first_res_no_1, dh.last_res_no_1,
                    dh.chain_name_2, dh.first_res_no_2, dh.last_res_no_2
                )
            );
        }

        return doubleHelices;
    }

    export function toCompounds(commands: Api.DensityFitCommands|Api.StandardCommands) {
        const compounds: Compound[] = [];

        for (const c of commands.compounds) {
            const type = c.ctype === 'Protein' ? 'protein' : c.ctype;
            if (!Compound.isType(type))
                throw new Error(`Compound type ${type} is not a valid compound type`);

            const chain = { name: c.chain.name, authName: c.chain.auth_name };
            const residues: ResidueNumber[] = [];
            for (const res of c.residues)
                residues.push({ number: res.number, authNumber: res.auth_number });
            const seq = Compound.stringToSequence(c.sequence, type);
            compounds.push(new Compound(type, chain, seq, residues));
        }

        return compounds;
    }

    export function toGlobal(commands: Api.CommonCommands) {
        const bisf = commands.base_interaction_scale_factor;
        const temp = commands.temperature;

        if (bisf < 0)
            throw new Error('Invalid baseInteractionScaleFactor value');

        return new GlobalConfig(bisf, temp);
    }

    export function toMdParams(commands: Api.DensityFitCommands|Api.StandardCommands) {
        const defMd = commands.set_default_MD_parameters;

        return new MdParameters(defMd);
    }

    export function toMobilizers(commands: Api.DensityFitCommands|Api.StandardCommands) {
        const mobilizers: Mobilizer[] = [];

        for (const m of commands.mobilizers) {
            if (!Mobilizer.isBondMobility(m.bond_mobility))
                throw new Error(`Invalid bond mobility ${m.bond_mobility}`);

            const bondMobility = m.bond_mobility;
            if (!m.chain)
                mobilizers.push(new Mobilizer(bondMobility));
            else {
                const chain = getChain(m.chain);

                if (m.first_residue !== null && m.last_residue !== null)
                    mobilizers.push(new Mobilizer(bondMobility, chain, new ResidueSpan(m.first_residue!, m.last_residue!)));
                else
                    mobilizers.push(new Mobilizer(bondMobility, chain));
            }
        }

        return mobilizers;
    }

    export function toNtCs(commands: Api.DensityFitCommands|Api.StandardCommands) {
        const conformations: NtCConformation[] = [];

        for (const ntc of commands.ntcs.conformations) {
            conformations.push(
                new NtCConformation(ntc.chain_name, ntc.first_res_no, ntc.last_res_no, ntc.ntc)
            );
        }

        return { conformations, forceScaleFactor: commands.ntcs.force_scale_factor };
    }

    export function toReporting(commands: Api.CommonCommands) {
        const count = commands.num_reporting_intervals;
        const interval = commands.reporting_interval;

        if (isNaN(Num.parseIntStrict(count)))
            throw new Error('Invalid number of reporting intervals');
        if (isNaN(Num.parseFloatStrict(interval)))
            throw new Error('Invalid reporting interval');

        return new Reporting(interval, count);
    }

    export function toStages(commands: Api.CommonCommands) {
        const first = Num.parseIntStrict(commands.first_stage);
        const last = Num.parseIntStrict(commands.last_stage);

        return new StagesSpan(first, last);
    }
}