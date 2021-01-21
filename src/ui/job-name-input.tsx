/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ErrorBox } from './common/error-box';
import { FormBlock } from './common/form/form-block';
import { LabeledField } from './common/form/labeled-field';
import { MmbInputModel as MIM } from '../model/mmb-input-model';

const StrLField = LabeledField.LineEdit<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();

export class JobNameInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, JobNameInput.Props> {
    renderName() {
        if (this.props.name === undefined) {
            return (
                <>
                    <StrLField
                        id='mol-in-job-name'
                        keyId='mol-in-job-name'
                        style='left'
                        label='Job name'
                        ctxData={this.props.ctxData} />
                    <ErrorBox
                        errors={this.props.ctxData.errors.get('mol-in-no-name') ?? new Array<string>()} />
                </>
            );
        }
        return (
            <>
                <span>Name </span>
                <span className='bold'>{this.props.name}</span>
            </>
        );
    }
    render() {
        return (
            <div>
                {this.renderName()}
            </div>
        );
    }
}

export namespace JobNameInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
        name?: string;
    }
}