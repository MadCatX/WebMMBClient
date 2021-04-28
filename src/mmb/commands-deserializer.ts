/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for defails.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Parameters, ParameterNames } from '../mmb/available-parameters';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
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
import { DefaultMdParamsKey, JsonAdvancedParameters, JsonCommands } from './commands';
import { Num } from '../util/num';

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

    function getSingleBool(toks: string[], pos = 0) {
        const v = toks[pos];
        if (v === 'True')
            return true;
        if (v === 'False')
            return false;
        throw new Error(`Invalid boolean value ${v}`);
    }

    function getSingleFloat(toks: string[], pos = 0) {
        const n = Num.parseFloatStrict(toks[pos]);
        if (isNaN(n))
            throw new Error(`Invalid value ${toks[pos]}`);
        return n;
    }

    function getSingleInt(toks: string[], pos = 0) {
        const n = Num.parseIntStrict(toks[pos]);
        if (isNaN(n))
            throw new Error(`Invalid value ${toks[pos]}`);
        return n;
    }

    export function toAdvancedParameters(commands: JsonCommands): JsonAdvancedParameters {
        const advParams = {} as JsonAdvancedParameters;

        for (const key in commands.advParams) {
            if (!Parameters.has(key as ParameterNames))
                throw new Error(`Advanced parameter ${key} does not exist`);

            const value = commands.advParams[key];
            const param = Parameters.get(key as ParameterNames)!;
            if (P.isIntegral(param)) {
                const num = Num.parseIntStrict(value);
                if (param.isValid(num))
                    advParams[key] = num;
                else
                    throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
            } else if (P.isReal(param)) {
                const num = Num.parseFloatStrict(value);
                if (param.isValid(num))
                    advParams[key] = num;
                else
                    throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
            } else if (P.isBoolean(param)) {
                if (param.chkType(value))
                    advParams[key] = value;
                else
                    throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
            } else if (P.isTextual(param)) {
                if (param.chkType(value))
                    advParams[key] = value;
                else
                    throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
            } else if (P.isOptions(param)) {
                if (param.chkType(value))
                    advParams[key] = value;
                else
                    throw new Error(`Advanced parameter ${key} has invalid value ${value}`);
            }
        }

        return advParams;
    }

    export function toBaseInteractions(commands: JsonCommands) {
        const baseInteractions: BaseInteraction[] = [];

        for (const line of commands.baseInteractions) {
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

    export function toDoubleHelices(commands: JsonCommands) {
        const doubleHelices: DoubleHelix[] = [];

        for (const line of commands.doubleHelices) {
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

    export function toCompounds(commands: JsonCommands) {
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
                throw new Error(`Invalid compound type ${def[0]}`);
            })();

            const chain = getChain(def[1]);
            const firstResNo = getResNo(def[2]);
            const seq = Compound.stringToSequence(def[3]);

            compounds.push(new Compound(chain, firstResNo, type, seq));
        }

        return compounds;
    }

    export function toGlobal(commands: JsonCommands) {
        const bisf = getSingleInt(commands.baseInteractionScaleFactor);
        const mt = getSingleBool(commands.useMultithreadedComputation);
        const temp = getSingleFloat(commands.temperature);

        if (bisf < 0)
            throw new Error('Invalid baseInteractionScaleFactor value');

        return new GlobalConfig(bisf, mt, temp);
    }

    export function toMdParams(commands: JsonCommands) {
        const defMd = Object(commands).hasOwnProperty(DefaultMdParamsKey);

        return new MdParameters(defMd);
    }

    export function toMobilizers(commands: JsonCommands) {
        const mobilizers: Mobilizer[] = [];

        for (const m of commands.mobilizers) {
            if (!Mobilizer.isBondMobility(m.bondMobility))
                throw new Error(`Invalid bond mobility ${m.bondMobility}`);

            const bondMobility = m.bondMobility;
            if (!m.chain)
                mobilizers.push(new Mobilizer(bondMobility));
            else {
                const chain = getChain(m.chain);

                if (m.firstResidue !== undefined && m.lastResidue !== undefined)
                    mobilizers.push(new Mobilizer(bondMobility, chain, new ResidueSpan(m.firstResidue, m.lastResidue)));
                else
                    mobilizers.push(new Mobilizer(bondMobility, chain));
            }
        }

        return mobilizers;
    }

    export function toNtCs(commands: JsonCommands) {
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

    export function toReporting(commands: JsonCommands) {
        const count = getSingleInt(commands.numReportingIntervals);
        const interval = getSingleFloat(commands.reportingInterval);

        return new Reporting(interval, count);
    }

    export function toStages(commands: JsonCommands) {
        const first = getSingleInt(commands.firstStage);
        const last = getSingleInt(commands.lastStage);

        return new StagesSpan(first, last);
    }
}