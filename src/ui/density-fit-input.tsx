/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormBlock } from './common/form/form-block';
import { MmbInputModel as MIM } from '../model/mmb-input-model';

interface State {
}

export class DensityFitInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, DensityFitInput.Props, State> {
    render() {
        return (<div>...</div>);
    }
}

export namespace DensityFitInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}
