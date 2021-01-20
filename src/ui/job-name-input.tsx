/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormBlock } from './common/form-block';
import { GLabeledField, LabeledField } from './common/labeled-field';
import { ErrorBox } from './common/error-box';
import { MmbInputModel as MIM } from '../model/mmb-input-model';

const StrLabeledField = LabeledField<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, string>();

export class JobNameInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, JobNameInput.Props> {
    renderName() {
        if (this.props.name === undefined) {
            return (
                <>
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-job-name', this.props.formId, ['labeled-field'])}
                        style='left'
                        label='Job name'
                        inputType='line-edit'
                        options={[]}
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