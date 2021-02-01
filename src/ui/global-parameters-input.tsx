/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormBlock } from './common/form/form-block';
import { LabeledField } from './common/form/labeled-field';
import { MmbInputModel as MIM } from '../model/mmb-input-model';

const NumLField = LabeledField.LineEdit<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const StagesLField = LabeledField.ComboBox<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, number>();
const CHLField = LabeledField.CheckBox<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();

export class GlobalParametersInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, GlobalParametersInput.Props> {
    render() {
        return (
            <div className='section'>
                <div className='section-caption'>Global parameters</div>
                <div className='mol-in-gp-input'>
                    <NumLField
                        id='mol-in-gp-bisf'
                        keyId='mol-in-gp-bisf'
                        label='Interaction scale factor'
                        tooltip='baseInteractionScaleFactor'
                        style='above'
                        ctxData={this.props.ctxData} />
                    <NumLField
                        id='mol-in-gp-reporting-interval'
                        keyId='mol-in-gp-reporting-interval'
                        label='Reporting interval'
                        tooltip='reportingInterval'
                        style='above'
                        ctxData={this.props.ctxData} />
                    <NumLField
                        id='mol-in-gp-num-reports'
                        keyId='mol-in-gp-num-reports'
                        label='Number of reports'
                        tooltip='numReportingIntervals'
                        style='above'
                        ctxData={this.props.ctxData} />
                    <NumLField
                        id='mol-in-gp-temperature'
                        keyId='mol-in-gp-temperature'
                        label='Temperature'
                        tooltip='temperature'
                        style='above'
                        ctxData={this.props.ctxData} />
                    <StagesLField
                        id='mol-in-gp-stage'
                        keyId='mol-in-gp-stage'
                        label='Stage'
                        tooltip='firstStage, lastStage'
                        style='above'
                        options={this.props.availableStages.map(n => { return { caption: n.toString(), value: n }})}
                        stringifier={v => v?.toString() ?? ''}
                        ctxData={this.props.ctxData} />
                    <CHLField
                        id='mol-in-gp-def-md-params'
                        keyId='mol-in-gp-def-md-params'
                        label='Turn on electrostatic and Lennard-Jones forces'
                        tooltip='setDefaultMDParameters'
                        style='left'
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
