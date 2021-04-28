/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AnyObject, assignAll, isArr, isInt, isObj, isStr } from '../util/json';

export type JsonAdvancedParameters = Record<string, string | boolean | number>;

export interface MobilizerParameter {
    bondMobility: string;
    chain?: string;
    firstResidue?: number;
    lastResidue?: number;
}

export const DefaultMdParamsKey = 'setDefaultMDParameters';

const JsonCommands = {
    baseInteractionScaleFactor: [] as string[],
    useMultithreadedComputation: [] as string[],
    temperature: [] as string[],
    firstStage:  [] as string[],
    lastStage: [] as string[],
    reportingInterval: [] as string[],
    numReportingIntervals: [] as string[],
    sequences: [] as string[],
    doubleHelices: [] as string[],
    baseInteractions: [] as string[],
    ntcs: [] as string[],
    mobilizers: [] as MobilizerParameter[],
    advParams: {} as JsonAdvancedParameters,
};
export type JsonCommands = typeof JsonCommands;

export function jsonCommandsFromJson(obj: unknown): JsonCommands {
    if (!isObj(obj))
        throw new Error('Input variable is not an object');

    for (const prop in JsonCommands) {
        if (!obj.hasOwnProperty(prop))
            throw new Error(`No property ${prop} on source object`);
        if (prop === 'advParams') {
            if (!isObj(obj[prop]))
                throw new Error(`Property ${prop} is not an object`);
        } else if (prop === 'mobilizers') {
            if (!isArr<MobilizerParameter>(obj[prop], (v): v is MobilizerParameter => {
                if (!isObj(v))
                    return false;

                if (!v.hasOwnProperty('bondMobility'))
                    return false;
                const mp = v as unknown as MobilizerParameter;

                if (!isStr(mp.bondMobility))
                    return false;
                if (mp.chain && !isStr(mp.chain))
                    return false;
                if (mp.firstResidue && !isInt(mp.firstResidue))
                    return false;
                if (mp.lastResidue && !isInt(mp.lastResidue))
                    return false;

                return true;
            }))
                throw new Error(`Property ${prop} has a wrong type`);
        } else if (!isArr<string>(obj[prop], isStr))
            throw new Error(`Property ${prop} is not a string array`);
    }

    let cmds = assignAll({}, obj, JsonCommands) as AnyObject;
    if (obj.hasOwnProperty(DefaultMdParamsKey))
        cmds[DefaultMdParamsKey] = [] as string[];

    return cmds as JsonCommands;
}