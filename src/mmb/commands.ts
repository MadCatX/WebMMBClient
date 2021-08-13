/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { assignAll, checkProps, checkType, isArr, isBool, isInt, isNum, isObj, isStr } from '../util/json';
import * as Api from './api';
import * as AO from './api-objs';
import { NtC } from '../model/ntc';

function isAdvancedParams(v: unknown): v is Api.JsonAdvancedParameters {
    return isObj(v);
}

function isChain(v: unknown): v is Api.Chain {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, AO.Chain);

        const tObj = v as Api.Chain;

        checkType(tObj, 'name', isStr);
        checkType(tObj, 'auth_name', isStr);

        return true;
    } catch (e) {
        return false;
    }
}

function isEdge(v: unknown): v is Api.EdgeInteraction {
    if (!isStr(v))
        return false;
    return v === 'WatsonCrick' || v === 'SugarEdge';
}

function isOrientation(v: unknown): v is Api.Orientation {
    if (!isStr(v))
        return false;
    return v === 'Cis' || v === 'Trans';
}

function isResidueNumber(v: unknown): v is Api.ResidueNumber {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, AO.ResidueNumber);

        const tObj = v as Api.ResidueNumber;

        checkType(tObj, 'number', isInt);
        checkType(tObj, 'auth_number', isInt);

        return true;
    } catch (e) {
        return false;
    }
}
function isResidueNumberArr(v: unknown): v is Api.ResidueNumber[] {
    return isArr<Api.ResidueNumber>(v, isResidueNumber);
}

function isBaseInteraction(v: unknown): v is Api.BaseInteraction {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, AO.BaseInteractionParametrer);

        const tObj = v as Api.BaseInteraction;

        checkType(tObj, 'chain_name_1', isStr);
        checkType(tObj, 'res_no_1', isInt);
        checkType(tObj, 'edge_1', isEdge);
        checkType(tObj, 'chain_name_2', isStr);
        checkType(tObj, 'res_no_2', isInt);
        checkType(tObj, 'edge_2', isEdge);
        checkType(tObj, 'orientation', isOrientation);

        return true;
    } catch (e) {
        return false;
    }
}
function isBaseInteractionArr(v: unknown): v is Api.BaseInteraction[] {
    return isArr(v, isBaseInteraction);
}

function isCompound(v: unknown): v is Api.Compound {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, AO.CompoundParameter);

        const tObj = v as Api.Compound;

        checkType(tObj, 'chain', isChain);
        checkType(tObj, 'ctype', isCompoundType);
        checkType(tObj, 'residues', isResidueNumberArr);
        checkType(tObj, 'sequence', isStr);

        return true;
    } catch (e) {
        return false;
    }
}
function isCompoundArr(v: unknown): v is Api.Compound[] {
    return isArr<Api.Compound>(v, isCompound);
}

function isCompoundType(v: unknown): v is 'DNA' | 'RNA' | 'Protein' {
    if (!isStr(v))
        return false;

    return v === 'DNA' || v === 'RNA' || v === 'Protein';
}

function isDoubleHelix(v: unknown): v is Api.DoubleHelix {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, AO.DoubleHelixParameter);

        const tObj = v as Api.DoubleHelix;

        checkType(tObj, 'chain_name_1', isStr);
        checkType(tObj, 'first_res_no_1', isInt);
        checkType(tObj, 'last_res_no_1', isInt);
        checkType(tObj, 'chain_name_1', isStr);
        checkType(tObj, 'first_res_no_2', isInt);
        checkType(tObj, 'last_res_no_2', isInt);

        return true;
    } catch (e) {
        return false;
    }
}
function isDoubleHelixArr(v: unknown): v is Api.DoubleHelix[] {
    return isArr(v, isDoubleHelix);
}

function isMobilizer(v: unknown): v is Api.Mobilizer {
    if (!isObj(v))
        return false;

    if (!v.hasOwnProperty('bond_mobility'))
        return false;
    const mp = v as Api.Mobilizer;

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
function isMobilizerArr(v: unknown): v is Api.Mobilizer[] {
    return isArr<Api.Mobilizer>(v, isMobilizer);
}

function isNtCConformer(v: unknown): v is string {
    if (!isStr(v))
        return false;
    return NtC.isConformer(v);
}

function isNtC(v: unknown): v is Api.NtC {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, AO.NtCParameter);

        const tObj = v as Api.NtC;

        checkType(tObj, 'chain_name', isStr);
        checkType(tObj, 'first_res_no', isInt);
        checkType(tObj, 'last_res_no', isInt);
        checkType(tObj, 'ntc', isNtCConformer);
        checkType(tObj, 'weight', isNum);

        return true;
    } catch (e) {
        return false;
    }
}
function isNtCArr(v: unknown): v is Api.NtC[] {
    return isArr(v, isNtC);
}

export function isCommonCommands(v: unknown): v is Api.CommonCommands {
    if (!isObj(v))
        return false;

    try {
        checkProps(v, AO.CommonCommands);

        const tObj = v as Api.CommonCommands;

        checkType(tObj, 'reporting_interval', isNum);
        checkType(tObj, 'num_reporting_intervals', isInt);
        checkType(tObj, 'first_stage', isInt);
        checkType(tObj, 'last_stage', isInt);
        checkType(tObj, 'num_reporting_intervals', isInt);
        checkType(tObj, 'temperature', isNum);

        return true;
    } catch (e) {
        return false;
    }

}

export function isDensityFitCommands(v: unknown): v is Api.DensityFitCommands {
    if (!isCommonCommands(v))
        return false;

    try {
        checkProps(v, AO.DensityFitCommands);

        const tObj = v as Api.DensityFitCommands;

        if (tObj.job_type !== 'DensityFit')
            return false;

        checkType(tObj, 'structure_file_name', isStr);
        checkType(tObj, 'density_map_file_name', isStr);
        checkType(tObj, 'compounds', isCompoundArr);
        checkType(tObj, 'mobilizers', isMobilizerArr);

        return true;
    } catch (e) {
        return false;
    }
}

export function isStandardCommands(v: unknown): v is Api.StandardCommands {
    if (!isCommonCommands(v))
        return false;

    try {
        checkProps(v, AO.StandardCommands);

        const tObj = v as unknown as Api.StandardCommands;

        if (tObj.job_type !== 'Standard')
            return false;

        checkType(tObj, 'compounds', isCompoundArr);
        checkType(tObj, 'double_helices', isDoubleHelixArr);
        checkType(tObj, 'base_interactions', isBaseInteractionArr);
        checkType(tObj, 'ntcs', isNtCArr);
        checkType(tObj, 'mobilizers', isMobilizerArr);
        checkType(tObj, 'adv_params', isAdvancedParams);
        checkType(tObj, 'set_default_MD_parameters', isBool);

        return true;
    } catch (e) {
        return false;
    }
}

export function commandsFromJson(v: unknown): Api.StandardCommands | Api.DensityFitCommands {
    if (!isCommonCommands(v))
        throw new Error('Object is not Commands object');

    if (isStandardCommands(v))
        return assignAll({}, v, AO.StandardCommands);
    else if (isDensityFitCommands(v))
        return assignAll({}, v, AO.DensityFitCommands);

    throw new Error('Object appears to be a Commands object of unknown job type');
}