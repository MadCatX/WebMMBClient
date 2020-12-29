/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormBlock } from './common/form-block';
import { FormContextManager as FCM } from './form-context-manager';
import { GLabeledField, LabeledField } from './common/labeled-field';
import { MmbInputUtil as MmbUtil } from './mmb-input-form-util';
import { ErrorBox } from './common/error-box';

const StrLabeledField = LabeledField<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.Values, string>();

export class JobNameInputInner extends React.Component<JobNameInputInner.Props> {
    renderName() {
        if (this.props.name === undefined) {
            return (
                <>
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-job-name', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        style='left'
                        label='Job name'
                        inputType='line-edit'
                        options={[]} />
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

export namespace JobNameInputInner {
    export interface Props extends FormBlock.Props {
        ctxData: MmbUtil.ContextData;
        name?: string;
    }
}

export class JobNameInput extends FormBlock<JobNameInput.Props> {
    render() {
        const CC = FCM.getContext(this.props.formId).Consumer;

        return (
            <CC>
                {(data: MmbUtil.ContextData) =>
                    <JobNameInputInner {...this.props} ctxData={data} />
                }
            </CC>
        );
    }
}

export namespace JobNameInput {
    export interface Props extends FormBlock.Props {
        name?: string;
    }
}