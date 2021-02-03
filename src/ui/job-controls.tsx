/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { PushButton } from './common/push-button';
import { JobState } from '../mmb/api';

export class JobControls extends React.Component<JobControls.Props> {
    render() {
        return (
            <div>
                <div className='job-controls-btns'>
                    <PushButton
                        className='pushbutton-common pushbutton-flex pushbutton-clr-default pushbutton-hclr-green'
                        classNameDisabled='pushbutton-common pushbutton-flex pushbutton-clr-default-disabled'
                        value='Start'
                        enabled={this.props.jobState !== 'Running'}
                        onClick={e => {
                            e.preventDefault();
                            this.props.handleStart();
                        }} />
                    <PushButton
                        className='pushbutton-common pushbutton-flex pushbutton-clr-default pushbutton-hclr-default'
                        classNameDisabled='pushbutton-common pushbutton-flex pushbutton-clr-default-disabled'
                        value='Status'
                        enabled={this.props.jobState !== 'NotStarted'}
                        onClick={e => {
                            e.preventDefault();
                            this.props.handleStatus();
                        }} />
                    <PushButton
                        className='pushbutton-common pushbutton-flex pushbutton-clr-default pushbutton-hclr-red'
                        classNameDisabled='pushbutton-common pushbutton-flex pushbutton-clr-default-disabled'
                        value='Stop'
                        enabled={this.props.jobState === 'Running'}
                        onClick={e => {
                            e.preventDefault();
                            this.props.handleStop();
                        }} />
                </div>
            </div>
        );
    }
}

export namespace JobControls {
    export interface Props {
        handleStart: () => void;
        handleStatus: () => void;
        handleStop: () => void;
        jobState: JobState;
    }
}
