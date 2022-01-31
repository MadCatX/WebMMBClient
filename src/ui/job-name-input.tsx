/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { LabeledField } from './common/controlled/labeled-field';

const StrLField = LabeledField.LineEdit<string>();

export class JobNameInput extends React.Component<JobNameInput.Props> {
    renderName() {
        if (!this.props.name) {
            return (
                <>
                    <StrLField
                        id='mol-in-job-name'
                        style='left'
                        label='Job name'
                        value={this.props.name}
                        updateNotifier={v => this.props.onNameChanged(v) }
                    />
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
    export interface Props {
        onNameChanged(name: string): void;
        name: string;
    }
}