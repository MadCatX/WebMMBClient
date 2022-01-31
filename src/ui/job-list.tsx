/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { JobItem } from './job-item';
import { LabeledField } from './common/controlled/labeled-field';
import { PushButton } from './common/push-button';
import * as Api from '../mmb/api';
import { JobQuery } from '../mmb/job-query';
import { Net } from '../util/net';

const StrLField = LabeledField.LineEdit<string>();

interface State {
    jobs: Api.JobList;
    newJobName: string;
    error: string;
}

export class JobList extends React.Component<JobList.Props, State> {
    private createJobAborter: AbortController | null = null;
    private deleteJobAborter: AbortController | null = null;
    private listJobsAborter: AbortController | null = null;
    private selectJobAborter: AbortController | null = null;

    constructor(props: JobList.Props) {
        super(props);

        this.state = {
            jobs: [],
            newJobName: '',
            error: '',
        };
    }

    private async createJob(name: string) {
        if (this.state.newJobName === '') {
            this.setState({
                ...this.state,
                error: 'Job must have a name',
            });
            return;
        }

        Net.abortFetch(this.createJobAborter);

        const task = JobQuery.create(name);
        this.createJobAborter = task.aborter;

        try {
            const jobCreated = await task.performer();
            if (!jobCreated)
                return;
            this.props.onSelectJob(jobCreated.id);
        } catch (e) {
            this.setState({
                ...this.state,
                error: (e as Error).toString(),
            });
        }
    }

    private async deleteJob(id: string) {
        Net.abortFetch(this.deleteJobAborter);

        const task = JobQuery.del(id);
        this.deleteJobAborter = task.aborter;

        try {
            await task.performer();
            this.refresh();
        } catch (e) {
            this.setState({
                ...this.state,
                error: (e as Error).toString(),
            });
        }
    }

    private async refresh() {
        Net.abortFetch(this.listJobsAborter);

        const task = JobQuery.list();
        this.listJobsAborter = task.aborter;

        try {
            const jobs = await task.performer();
            if (!jobs)
                return;
            this.setState({
                ...this.state,
                jobs,
                error: '',
            });
        } catch (e) {
            this.setState({
                ...this.state,
                jobs: [],
                error: (e as Error).toString(),
            });
        }
    }

    private renderInner() {
        if (this.state.error !== '') {
            return (<div className='error-message'>{this.state.error}</div>);
        } else {
            const sorted = this.state.jobs.sort((a, b) => a.created_on - b.created_on);
            return (
                <div>
                    <div className='job-item'>
                        <div className='table-column-header'>Name</div>
                        <div className='table-column-header'>State</div>
                        <div className='table-column-header'>Created on</div>
                        <div></div>
                        <div></div>
                    </div>
                    {sorted.map(e =>
                        <JobItem
                            key={e.id}
                            id={e.id}
                            name={e.name}
                            state={e.state}
                            created_on={e.created_on}
                            notifyCloned={(_id: string) => this.refresh()}
                            onSelect={() => this.selectJob(e.id)}
                            onDelete={() => this.deleteJob(e.id)} />
                    )}
                </div>
            );
        }
    }

    private selectJob(id: string) {
        const job = this.state.jobs.find(e => e ? e.id === id : undefined);
        if (job === undefined)
            throw new Error(`Job ${id} does not exist`);

        this.props.onSelectJob(id);
    }

    componentDidMount() {
        this.refresh();
    }

    componentWillUnmount() {
        Net.abortFetch(this.createJobAborter);
        Net.abortFetch(this.deleteJobAborter);
        Net.abortFetch(this.listJobsAborter);
        Net.abortFetch(this.selectJobAborter);
    }

    render() {
        return (
            <div className='job-list-container'>
                <div className='section-caption'>Jobs</div>
                <div className='job-items-container'>
                    {this.renderInner()}
                </div>
                <StrLField
                    id='new-job-name'
                    label='New job name'
                    style='left'
                    value={this.state.newJobName}
                    updateNotifier={v => this.setState({ ...this.state, newJobName: v })}
                />
                <PushButton
                    className='pushbutton-common pushbutton-default pushbutton-clr-default pushbutton-hclr-green'
                    value='+ New job'
                    onClick={() => this.createJob(this.state.newJobName)} />
            </div>
        );
    }
}

export namespace JobList {
    export interface OnSelectJob {
        (id: string): void;
    }

    export interface Props {
        onSelectJob: OnSelectJob;
    }
}