/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AnyObject, assignAll, isArr, isObj, isStr } from '../util/json';

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
};
export type JsonCommands = typeof JsonCommands;

export function jsonCommandsFromJson(obj: unknown): JsonCommands {
    if (!isObj(obj))
        throw new Error('Input variable is not an object');

    for (const prop in JsonCommands) {
        if (!obj.hasOwnProperty(prop))
            throw new Error(`No property ${prop} on source object`);
        if (!isArr<string>(obj[prop], isStr))
            throw new Error(`Property ${prop} is not a string array`);
    }

    let cmds = assignAll({}, obj, JsonCommands) as AnyObject;
    if (obj.hasOwnProperty(DefaultMdParamsKey))
        cmds[DefaultMdParamsKey] = [] as string[];

    return cmds as JsonCommands;
}