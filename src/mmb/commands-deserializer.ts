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
import { Compound } from '../model/compound';
import { DensityFitFiles } from '../model/density-fit-files';
import { DoubleHelix } from '../model/double-helix';
import { EdgeInteraction } from '../model/edge-interaction';
import { GlobalConfig } from '../model/global-config';
import { MdParameters } from '../model/md-parameters';
import { Mobilizer, ResidueSpan } from '../model/mobilizer';
import { NtC } from '../model/ntc';
import { NtCConformation } from '../model/ntc-conformation';
import { Orientation } from '../model/orientation';
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

    function getEdge(tok: string): EdgeInteraction.Edge {
        if (EdgeInteraction.isEdge(tok))
            return tok;
        throw new Error(`Invalid edge interaction ${tok}`);
    }

    function getNtC(tok: string) {
        if (NtC.isConformer(tok))
            return tok;
        throw new Error(`Invalid NtC ${tok}`);
    }

    function getOrientation(tok: string): Orientation.Orientation {
        if (Orientation.isOrientation(tok))
            return tok;
        throw new Error(`Invalid orientation ${tok}`);
    }

    function getResNo(tok: string) {
        const n = Num.parseIntStrict(tok);
        if (isNaN(n))
            throw new Error('Invalid residue no');
        return n;
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

        for (const line of commands.base_interactions) {
            const def = line.split(' ');

            if (def.length !== 8)
                throw new Error('Invalid number of tokens');

            if (def[0] !== 'baseInteraction')
                throw new Error(`Invalid prefix ${def[0]}`);

            const chainOne = getChain(def[1]);
            const resOne = getResNo(def[2]);
            const edgeOne = getEdge(def[3]);
            const chainTwo = getChain(def[4]);
            const resTwo = getResNo(def[5]);
            const edgeTwo = getEdge(def[6]);
            const orientation = getOrientation(def[7]);

            baseInteractions.push(
                new BaseInteraction(
                    chainOne, resOne, edgeOne,
                    chainTwo, resTwo, edgeTwo,
                    orientation
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

        for (const line of commands.double_helices) {
            const def = line.split(' ');

            if (def.length !== 7)
                throw new Error('Invalid number of tokens');

            if (def[0] !== 'nucleicAcidDuplex')
                throw new Error(`Invalid prefix ${def[0]}`);

            const chainOne = getChain(def[1]);
            const firstResNoOne = getResNo(def[2]);
            const lastResNoOne = getResNo(def[3]);

            const chainTwo = getChain(def[4]);
            const firstResNoTwo = getResNo(def[5]);
            const lastResNoTwo = getResNo(def[6]);

            doubleHelices.push(
                new DoubleHelix(
                    chainOne, firstResNoOne, lastResNoOne,
                    chainTwo, firstResNoTwo, lastResNoTwo
                )
            );
        }

        return doubleHelices;
    }

    export function toCompounds(commands: Api.StandardCommands) {
        const compounds: Compound[] = [];

        for (const line of commands.sequences) {
            const def = line.split(' ');
            if (def.length !== 4)
                throw new Error('Invalid number of tokens');

            const type = ((): Compound.Type => {
                if (def[0] === 'DNA')
                    return 'DNA';
                if (def[0] === 'RNA')
                    return 'RNA';
                if (def[0] === 'protein')
                    return 'protein';
                throw new Error(`Invalid compound type ${def[0]}`);
            })();

            const chain = getChain(def[1]);
            const firstResNo = getResNo(def[2]);
            const seq = Compound.stringToSequence(def[3], type);

            compounds.push(new Compound(chain, firstResNo, type, seq));
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

    export function toMdParams(commands: Api.StandardCommands) {
        const defMd = commands.set_default_MD_parameters;

        return new MdParameters(defMd);
    }

    export function toMobilizers(commands: Api.StandardCommands) {
        const mobilizers: Mobilizer[] = [];

        for (const m of commands.mobilizers) {
            if (!Mobilizer.isBondMobility(m.bond_mobility))
                throw new Error(`Invalid bond mobility ${m.bond_mobility}`);

            const bondMobility = m.bond_mobility;
            if (!m.chain)
                mobilizers.push(new Mobilizer(bondMobility));
            else {
                const chain = getChain(m.chain);

                if (m.first_residue !== undefined && m.last_residue !== undefined)
                    mobilizers.push(new Mobilizer(bondMobility, chain, new ResidueSpan(m.first_residue, m.last_residue)));
                else
                    mobilizers.push(new Mobilizer(bondMobility, chain));
            }
        }

        return mobilizers;
    }

    export function toNtCs(commands: Api.StandardCommands) {
        const ntcs: NtCConformation[] = [];

        for (const line of commands.ntcs) {
            const def = line.split(' ');
            if (def.length !== 6)
                throw new Error('Invalid number of tokens');

            if (def[0] !== 'NtC')
                throw new Error(`Invalid prefix ${def[0]}`);

            const chain = getChain(def[1]);
            const firstResNo = getResNo(def[2]);
            const lastResNo = getResNo(def[3]);
            const ntc = getNtC(def[4]);

            ntcs.push(
                new NtCConformation(
                    chain, firstResNo, lastResNo, ntc
                )
            );
        }

        return ntcs;
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