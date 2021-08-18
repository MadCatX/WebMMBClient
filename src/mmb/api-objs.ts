/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';

export const CommonCommands: Api.CommonCommands = {
    reporting_interval: 0,
    num_reporting_intervals: 0,
    first_stage: 0,
    last_stage: 0,
    base_interaction_scale_factor: 0,
    temperature: 0,
};

export const StandardCommands: Api.StandardCommands = {
    ...CommonCommands,
    job_type: 'Standard',
    compounds: [],
    double_helices: [],
    base_interactions: [],
    ntcs: [],
    mobilizers: [],
    adv_params: {},
    set_default_MD_parameters: false,
};

export const DensityFitCommands: Api.DensityFitCommands = {
    ...CommonCommands,
    job_type: 'DensityFit',
    structure_file_name: '',
    density_map_file_name: '',
    compounds: [],
    mobilizers: [],
    ntcs: [],
    set_default_MD_parameters: false,
};

export const Chain: Api.Chain = {
    name: '',
    auth_name: '',
};

export const ResidueNumber: Api.ResidueNumber = {
    number: 0,
    auth_number: 0,
};

export const BaseInteractionParametrer: Api.BaseInteraction = {
    chain_name_1: '',
    res_no_1: 0,
    edge_1: 'WatsonCrick',
    chain_name_2: '',
    res_no_2: 0,
    edge_2: 'WatsonCrick',
    orientation: 'Cis',
};

export const CompoundParameter: Api.Compound = {
    chain: { name: '', auth_name: '' },
    ctype: 'DNA',
    residues: [],
    sequence: '',
};

export const DoubleHelixParameter: Api.DoubleHelix = {
    chain_name_1: '',
    first_res_no_1: 0,
    last_res_no_1: 0,
    chain_name_2: '',
    first_res_no_2: 0,
    last_res_no_2: 0,
};

export const NtCParameter: Api.NtC = {
    chain_name: '',
    first_res_no: 0,
    last_res_no: 0,
    ntc: '',
    weight: 0,
};
