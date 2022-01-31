/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { assignAll, checkProps, checkType, isArr, isBool, isInt, isNum, isObj, isStr } from '../util/json';
import * as Api from './api';
import * as AO from './api-objs';
import { AdvancedParameters } from '../model/mmb/advanced-parameters';
import { BaseInteraction } from '../model/mmb/base-interaction';
import { Compound } from '../model/mmb/compound';
import { DoubleHelix } from '../model/mmb/double-helix';
import { GlobalConfig } from '../model/mmb/global-config';
import { MdParameters } from '../model/mmb/md-parameters';
import { Mobilizer } from '../model/mmb/mobilizer';
import { NtC } from '../model/mmb/ntc';
import { Reporting } from '../model/mmb/reporting';

function isAdvancedParams(v: unknown): v is Api.JsonAdvancedParameters {
    return isObj(v);
}

function isChain(v: unknown): v is Api.Chain {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, AO.Chain))
            return false;

        checkType(v, 'name', isStr);
        checkType(v, 'auth_name', isStr);

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
        if (!checkProps(v, AO.ResidueNumber))
            return false;

        checkType(v, 'number', isInt);
        checkType(v, 'auth_number', isInt);

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
        if (!checkProps(v, AO.BaseInteractionParametrer))
            return false;

        checkType(v, 'chain_name_1', isStr);
        checkType(v, 'res_no_1', isInt);
        checkType(v, 'edge_1', isEdge);
        checkType(v, 'chain_name_2', isStr);
        checkType(v, 'res_no_2', isInt);
        checkType(v, 'edge_2', isEdge);
        checkType(v, 'orientation', isOrientation);

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
        if (!checkProps(v, AO.CompoundParameter))
            return false;

        checkType(v, 'chain', isChain);
        checkType(v, 'ctype', isCompoundType);
        checkType(v, 'residues', isResidueNumberArr);
        checkType(v, 'sequence', isStr);

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
        if (!checkProps(v, AO.DoubleHelixParameter))
            return false;

        checkType(v, 'chain_name_1', isStr);
        checkType(v, 'first_res_no_1', isInt);
        checkType(v, 'last_res_no_1', isInt);
        checkType(v, 'chain_name_1', isStr);
        checkType(v, 'first_res_no_2', isInt);
        checkType(v, 'last_res_no_2', isInt);

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

    if (!Object.prototype.hasOwnProperty.call(v, 'bond_mobility'))
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

function isNtCConformation(v: unknown): v is Api.NtCConformation {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, AO.NtCConformation))
            return false;

        checkType(v, 'chain_name', isStr);
        checkType(v, 'first_res_no', isInt);
        checkType(v, 'last_res_no', isInt);
        checkType(v, 'ntc', isNtCConformer);
        checkType(v, 'weight', isNum);

        return true;
    } catch (e) {
        return false;
    }
}
function isNtCConformationArr(v: unknown): v is Api.NtCConformation[] {
    return isArr(v, isNtCConformation);
}

function isNtCs(v: unknown): v is Api.NtCs {
    if (!isObj(v))
        return false;

    try {
        if (!checkProps(v, AO.NtCs))
            return false;

        checkType(v, 'conformations', isNtCConformationArr);
        checkType(v, 'force_scale_factor', isNum);

        return true;
    } catch (e) {
        return false;
    }
}

export namespace Commands {
    export type CommonParameters = {
        global: GlobalConfig,
        reporting: Reporting,
        stage: number;
    }

    export type DensityFitParameters = CommonParameters & {
        jobType: 'density-fit',
        densityFitFiles: { structure: string, densityMap: string },
        compounds: Compound[],
        mobilizers: Mobilizer[],
        ntcs: NtC.NtCs,
        mdParameters: MdParameters,
    }

    export type StandardParameters<K extends (string extends K ? never : string)> = CommonParameters & {
        jobType: 'standard';
        baseInteractions: BaseInteraction[],
        compounds: Compound[],
        doubleHelices: DoubleHelix[],
        mdParameters: MdParameters,
        ntcs: NtC.NtCs,
        mobilizers: Mobilizer[],
        advParams: AdvancedParameters.Type,
    }

    export function fromJson(v: unknown): Api.StandardCommands|Api.DensityFitCommands {
        if (!isCommon(v))
            throw new Error('Object is not Commands object');

        if (isStandard(v))
            return assignAll({}, v, AO.StandardCommands);
        else if (isDensityFit(v))
            return assignAll({}, v, AO.DensityFitCommands);

        throw new Error('Object appears to be a Commands object of unknown job type');
    }

    export function isCommon(v: unknown): v is Api.CommonCommands {
        if (!isObj(v))
            return false;

        try {
            if (!checkProps(v, AO.CommonCommands))
                return false;

            checkType(v, 'reporting_interval', isNum);
            checkType(v, 'num_reporting_intervals', isInt);
            checkType(v, 'num_reporting_intervals', isInt);
            checkType(v, 'temperature', isNum);

            return true;
        } catch (e) {
            return false;
        }
    }

    export function isDensityFit(v: unknown): v is Api.DensityFitCommands {
        if (!isCommon(v))
            return false;

        try {
            if (v.job_type !== 'DensityFit')
                return false;

            if (!checkProps(v, AO.DensityFitCommands))
                return false;

            checkType(v, 'structure_file_name', isStr);
            checkType(v, 'density_map_file_name', isStr);
            checkType(v, 'compounds', isCompoundArr);
            checkType(v, 'mobilizers', isMobilizerArr);
            checkType(v, 'ntcs', isNtCs);
            checkType(v, 'set_default_MD_parameters', isBool);

            return true;
        } catch (e) {
            return false;
        }
    }

    export function isStandard(v: unknown): v is Api.StandardCommands {
        if (!isCommon(v))
            return false;

        try {
            if (v.job_type !== 'Standard')
                return false;

            if (!checkProps(v, AO.StandardCommands))
                return false;

            checkType(v, 'compounds', isCompoundArr);
            checkType(v, 'double_helices', isDoubleHelixArr);
            checkType(v, 'base_interactions', isBaseInteractionArr);
            checkType(v, 'ntcs', isNtCs);
            checkType(v, 'mobilizers', isMobilizerArr);
            checkType(v, 'adv_params', isAdvancedParams);
            checkType(v, 'set_default_MD_parameters', isBool);

            return true;
        } catch (e) {
            return false;
        }
    }
}