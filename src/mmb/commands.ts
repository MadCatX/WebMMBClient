/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { assignAll, checkProps, checkType, isArr, isBool, isInt, isNum, isObj, isStr } from '../util/json';
import * as Api from './api';
import { CommonCommands, DensityFitCommands, StandardCommands } from './api-objs';

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

export function isCommonCommands(v: unknown): v is Api.CommonCommands {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, CommonCommands);

        const tObj = v as Api.CommonCommands;

        checkType(tObj, 'reporting_interval', isNum);
        checkType(tObj, 'num_reporting_intervals', isInt);
        checkType(tObj, 'first_stage', isInt);
        checkType(tObj, 'last_stage', isInt);
        checkType(tObj, 'num_reporting_intervals', isInt);
        checkType(tObj, 'temperature', isNum);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }

}

export function isDensityFitCommands(v: unknown): v is Api.DensityFitCommands {
    if (!isCommonCommands(v))
        return false;

    try {
        checkProps(v, DensityFitCommands);

        const tObj = v as Api.DensityFitCommands;

        if (tObj.job_type !== 'DensityFit')
            return false;

        checkType(tObj, 'structure_file_name', isStr);
        checkType(tObj, 'density_map_file_name', isStr);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export function isStandardCommands(v: unknown): v is Api.StandardCommands {
    if (!isCommonCommands(v))
        return false;

    try {
        checkProps(v, StandardCommands);

        const tObj = v as unknown as Api.StandardCommands;

        if (tObj.job_type !== 'Standard')
            return false;

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

export function commandsFromJson(v: unknown): Api.StandardCommands | Api.DensityFitCommands {
    if (!isCommonCommands(v))
        throw new Error('Object is not Commands object');

    if (isStandardCommands(v))
        return assignAll({}, v, StandardCommands);
    else if (isDensityFitCommands(v))
        return assignAll({}, v, DensityFitCommands);

    throw new Error('Object appears to be a Commands object of unknown job type');
}