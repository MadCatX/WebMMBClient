/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as Api from '../mmb/api';
import { PushButton } from './common/push-button';

export class JobItem extends React.Component<JobItem.Props> {
    private renderJobStatus(s: Api.JobStatus) {
        switch (s) {
        case 'running':
            return (<span className='centered-text ok-message'>Running</span>);
        case 'finished':
            return (<span className='centered-text job-done-message'>Finished</span>);
        case 'failed':
            return (<span className='centered-text error-message'>Failed</span>);
        default:
            return (<span className='centered-text error-message'>Unknown</span>);
        }
    }

    render() {
        return (
            <div className='job-item'>
                <span className='centered-text job-item-name'>{this.props.name}</span>
                {this.renderJobStatus(this.props.status)}
                <PushButton
                    className='pushbutton-chained pushbutton-hc-default'
                    value='Show >>'
                    onClick={() => this.props.onSelect(this.props.id)} />
                <PushButton
                    className='pushbutton-chained pushbutton-hc-red'
                    value='Delete'
                    onClick={() => this.props.onDelete(this.props.id)} />
            </div>
        );
    }
}

export namespace JobItem {
    export interface ClickHandler {
        (id: string): void;
    }

    export interface Props {
        id: string;
        name: string;
        status: Api.JobStatus;
        onSelect: ClickHandler;
        onDelete: ClickHandler;
    }
}