import * as React from 'react';
import * as Api from '../mmb/api';

export class JobStatus extends React.Component<JobStatus.Props> {
    private renderQueryError() {
        if (this.props.error !== '')
            return (<div className="error-message">{this.props.error}</div>);
        return undefined;
    }

    private jobStatusToText(status: Api.JobStatus) {
        switch (status) {
        case 'none':
            return (<div>Job has not been started</div>);
        case 'running':
            return (<div className="ok-message">Job is running</div>);
        case 'finished':
            return (<div className="job-done-message">Job has finished</div>);
        case 'failed':
            return (<div className="error-message">Job has failed</div>);
        }
        throw new Error('Invalid job status');
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
                    <span className="item-caption">Status</span>{this.jobStatusToText(this.props.status)}
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
        status: Api.JobStatus;
        step: Api.JobStep;
        totalSteps: Api.JobTotalSteps;
        error: string;
    }
}
