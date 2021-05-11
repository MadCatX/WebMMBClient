/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { assignAll, checkProps, checkType, isArr, isBool, isInt, isNum, isObj, isStr } from '../util/json';
import * as Api from './api';

const JsonCommands: Api.JsonCommands = {
    base_interaction_scale_factor: 0,
    use_multithreaded_computation: false,
    temperature: 0,
    first_stage: 0,
    last_stage: 0,
    reporting_interval: 0,
    num_reporting_intervals: 0,
    sequences: [],
    double_helices: [],
    base_interactions: [],
    ntcs: [],
    mobilizers: [],
    adv_params: {},
    set_default_MD_parameters: false,
};

function isAdvancedParams(v: unknown): v is Api.JsonAdvancedParameters {
    return isObj(v);
}

function isMobilizer(v: unknown): v is Api.MobilizerParameter {
    if (!isObj(v))
        return false;

    if (!v.hasOwnProperty('bond_mobility'))
        return false;
    const mp = v as Api.MobilizerParameter;

    if (!isStr(mp.bond_mobility))
        return false;
    if (mp.chain && !isStr(mp.chain))
        return false;
    if (mp.first_residue && !isInt(mp.first_residue))
        return false;
    if (mp.last_residue && !isInt(mp.last_residue))
        return false;

    return true;
}

function isMobilizerArr(v: unknown): v is Api.MobilizerParameter[] {
    return isArr<Api.MobilizerParameter>(v, isMobilizer);
}

function isStrArr(v: unknown): v is string[] {
    return isArr<string>(v, isStr);
}

export function isJsonCommands(v: unknown): v is Api.JsonCommands {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, JsonCommands);

        const tObj = v as Api.JsonCommands;

        checkType(tObj, 'base_interaction_scale_factor', isNum);
        checkType(tObj, 'use_multithreaded_computation', isBool);
        checkType(tObj, 'temperature', isNum);
        checkType(tObj, 'first_stage', isInt);
        checkType(tObj, 'last_stage', isInt);
        checkType(tObj, 'reporting_interval', isNum);
        checkType(tObj, 'num_reporting_intervals', isInt);
        checkType(tObj, 'sequences', isStrArr);
        checkType(tObj, 'double_helices', isStrArr);
        checkType(tObj, 'base_interactions', isStrArr);
        checkType(tObj, 'ntcs', isStrArr);
        checkType(tObj, 'mobilizers', isMobilizerArr);
        checkType(tObj, 'adv_params', isAdvancedParams);
        checkType(tObj, 'set_default_MD_parameters', isBool);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export function jsonCommandsFromJson(obj: unknown): Api.JsonCommands {
    if (!isJsonCommands(obj))
        throw new Error('Object is not JsonCommands');

    let cmds = assignAll({}, obj, JsonCommands);

    return cmds;
}