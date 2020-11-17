/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as Api from '../mmb/api';

export class JobStatus extends React.Component<JobStatus.Props> {
    private renderQueryError() {
        if (this.props.error !== '')
            return (<div className="error-message">{this.props.error}</div>);
        return undefined;
    }

    private jobStatusToText(state: Api.JobState) {
        switch (state) {
        case 'NotStarted':
            return (<div>Job has not been started</div>);
        case 'Running':
            return (<div className='ok-message'>Job is running</div>);
        case 'Finished':
            return (<div className='job-done-message'>Job has finished</div>);
        case 'Failed':
            return (<div className='error-message'>Job has failed</div>);
        }
    }

    private jobStepToText(step: Api.JobStep | Api.JobTotalSteps) {
        switch(step) {
        case 'none':
            return '-';
        case 'preparing':
            return 'Preparing...';
        default:
            return step.toString();
        }
    }

    render() {
        return (
            <div className="job-status-container">
                <div className="job-status">
                    <span className="item-caption">State</span>{this.jobStatusToText(this.props.state)}
                    <span className="item-caption">Step</span><div>{this.jobStepToText(this.props.step)}</div>
                    <span className="item-caption">Total steps</span><div>{this.jobStepToText(this.props.totalSteps)}</div>
                </div>
                {this.renderQueryError()}
            </div>
        );
    }
}

export namespace JobStatus {
    export interface Props {
        state: Api.JobState;
        step: Api.JobStep;
        totalSteps: Api.JobTotalSteps;
        error: string;
    }
}
