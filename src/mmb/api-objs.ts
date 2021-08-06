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
    sequences: [],
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
};
