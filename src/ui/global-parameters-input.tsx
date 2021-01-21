/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormBlock } from './common/form/form-block';
import { LabeledCheckBox, LabeledField, GLabeledField } from './common/form/labeled-field';
import { MmbInputModel as MIM } from '../model/mmb-input-model';

const NumLabeledField = LabeledField<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, number>();
const CheckBox = LabeledCheckBox<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();

export class GlobalParametersInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, GlobalParametersInput.Props> {
    render() {
        return (
            <div className='section'>
                <div className='section-caption'>Global parameters</div>
                <div className='mol-in-gp-input'>
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-gp-bisf', this.props.formId, ['labeled-field-concise'])}
                        label='Interaction scale factor'
                        tooltip='baseInteractionScaleFactor'
                        style='above'
                        inputType='line-edit'
                        options={[]}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-gp-reporting-interval', this.props.formId, ['labeled-field-concise'])}
                        label='Reporting interval'
                        tooltip='reportingInterval'
                        style='above'
                        inputType='line-edit'
                        options={[]}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-gp-num-reports', this.props.formId, ['labeled-field-concise'])}
                        label='Number of reports'
                        tooltip='numReportingIntervals'
                        style='above'
                        inputType='line-edit'
                        options={[]}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-gp-temperature', this.props.formId, ['labeled-field-concise'])}
                        label='Temperature'
                        tooltip='temperature'
                        style='above'
                        inputType='line-edit'
                        options={[]}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-gp-stage', this.props.formId, ['labeled-field-concise'])}
                        label='Stage'
                        tooltip='firstStage, lastStage'
                        style='above'
                        inputType='combo-box'
                        options={this.props.availableStages.map(n => { return{ caption: n.toString(), value: n.toString() }})}
                        ctxData={this.props.ctxData} />
                    <CheckBox
                        {...GLabeledField.tags('mol-in-gp-def-md-params', this.props.formId, ['labeled-field-concise'])}
                        label='Turn on electrostatic and Lennard-Jones forces'
                        tooltip='setDefaultMDParameters'
                        style='left'
                        inputType='check-box'
                        options={[]}
                        ctxData={this.props.ctxData} />
                </div>
            </div>
        );
    }
}

export namespace GlobalParametersInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
        availableStages: number[];
    }
}
