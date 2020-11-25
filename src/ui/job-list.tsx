/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { JobItem } from './job-item';
import { PushButton } from './common/push-button';
import { JsonCommands, jsonCommandsFromJson } from '../mmb/commands';
import * as Api from '../mmb/api';
import { JobQuery } from '../mmb/job-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';
import { Net } from '../util/net';

interface JobEntry {
    ok: boolean,
    id: string,
    name: string,
    state: Api.JobState,
    step: Api.JobStep,
    total_steps: Api.JobTotalSteps,
    last_completed_stage: number,
}

interface State {
    jobs: JobEntry[];
    error: string;
}

function jobListItemToEntry(item: Api.JobListItem): JobEntry {
    if (item.ok) {
        return {
            ok: true,
            id: item.info.id,
            name: item.info.name,
            state: item.info.state,
            step: item.info.step,
            total_steps: item.info.total_steps,
            last_completed_stage: item.info.last_completed_stage,
        };
    } else {
        return {
            ok: false,
            id: '',
            name: '',
            state: 'NotStarted',
            step: 0,
            total_steps: 0,
            last_completed_stage: 0,
        };
    }
}

export class JobList extends React.Component<JobList.Props, State> {
    private deleteJobAborter: AbortController | null = null;
    private listJobsAborter: AbortController | null = null;
    private selectJobAborter: AbortController | null = null;

    constructor(props: JobList.Props) {
        super(props);

        this.state = {
            jobs: [],
            error: '',
        };

        this.onSelectJobClicked = this.onSelectJobClicked.bind(this);
        this.onDeleteJobClicked = this.onDeleteJobClicked.bind(this);
    }

    componentDidMount() {
        this.refresh();
    }

    private onDeleteJobClicked(id: string) {
        Net.abortFetch(this.deleteJobAborter);

        const { promise, aborter } = JobQuery.del(id);
        this.deleteJobAborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(aborter))
                    return;

                const r = Response.parse<Api.Empty>(json, ResponseDeserializers.toEmpty);

                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        error: r.message
                    });
                } else {
                    this.refresh();
                    this.props.jobDeleted(id);
                }
            }).catch(e => {
                this.setState({
                    ...this.state,
                    error: e.toString(),
                });
            });
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                error: e.toString(),
            });
        });
    }

    private onSelectJobClicked(id?: string) {
        if (id === undefined) {
            this.props.onSelectJob(undefined);
            return;
        }

        const job = this.state.jobs.find(e => e.id === id);
        if (job === undefined)
            throw new Error(`Job ${id} does not exist`);

        Net.abortFetch(this.selectJobAborter);

        const { promise, aborter } = JobQuery.commands(id);
        this.selectJobAborter = aborter;
        promise.then(resp => {
            if (resp.status === 200) {
                resp.json().then(json => {
                    if (Net.isFetchAborted(aborter))
                        return;

                    const r = Response.parse<JsonCommands>(json, jsonCommandsFromJson);

                    if (Response.isError(r)) {
                        this.setState({
                            ...this.state,
                            error: r.message,
                        });
                    } else if (Response.isOk(r)) {
                        this.setState({
                            ...this.state,
                            error: '',
                        });
                        this.props.onSelectJob(job, r.data);
                    }
                }).catch(e => {
                    this.setState({
                        ...this.state,
                        error: e.toString(),
                    });
                });
            } else {
                this.setState({
                    ...this.state,
                    error: `Failed to fetch job commands (${resp.status}: ${resp.statusText}`,
                });
            }
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                error: e.toString(),
            });
        });
    }

    private refresh() {
        Net.abortFetch(this.listJobsAborter);

        const { promise, aborter } = JobQuery.list();
        this.listJobsAborter = aborter;
        promise.then(resp => {
            if (resp.status === 200) {
                resp.json().then(json => {
                    if (Net.isFetchAborted(aborter))
                        return;

                    const r = Response.parse<Api.JobListItem[]>(json, ResponseDeserializers.toJobList);

                    if (Response.isError(r)) {
                        this.setState({
                            ...this.state,
                            jobs: [],
                            error: 'Invalid job list data',
                        });
                    } else if (Response.isOk(r)) {
                        this.setState({
                            ...this.state,
                            jobs: r.data.map((item) => jobListItemToEntry(item)),
                            error: '',
                        });
                    }
                }).catch(e => {
                    this.setState({
                        ...this.state,
                        jobs: [],
                        error: `Cannot fetch list of jobs (${e.toString()})`,
                    });
                });
            } else {
                this.setState({
                    ...this.state,
                    jobs: [],
                    error: `Cannot fetch list of jobs (${resp.status} - ${resp.statusText})`,
                });
            }
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                jobs: [],
                error: `Cannot fetch list of jobs (${e.toString()})`,
            });
        });
    }

    private renderInner() {
        if (this.state.error !== '') {
            return (<div className='error-message'>{this.state.error}</div>);
        } else {
            return (
                <>
                    <div className='job-item'>
                        <div className='bold'>Name</div>
                        <div className='bold'>State</div>
                        <div></div>
                        <div></div>
                    </div>
                    {this.state.jobs.map((e, n) =>
                        <JobItem
                            key={`job-item-${n}`}
                            id={e.id}
                            name={e.name}
                            state={e.state}
                            onSelect={() => this.onSelectJobClicked(e.id)}
                            onDelete={() => this.onDeleteJobClicked(e.id)} />
                        )}
                </>
            );
        }
    }

    componentWillUnmount() {
        Net.abortFetch(this.deleteJobAborter);
        Net.abortFetch(this.listJobsAborter);
        Net.abortFetch(this.selectJobAborter);
    }

    render() {
        return (
            <div>
                <div className='section-caption'>Jobs</div>
                <div className='job-items-container'>
                    {this.renderInner()}
                </div>
                <PushButton
                    className='pushbutton-default pushbutton-clr-default pushbutton-hclr-green'
                    value='+ New job'
                    onClick={() => this.onSelectJobClicked(undefined)} />
            </div>
        );
    }
}

export namespace JobList {
    export interface JobDeleted {
        (id: string): void;
    }

    export interface OnSelectJob {
        (job?: Api.JobInfo, commands?: JsonCommands): void;
    }

    export interface Props {
        onSelectJob: OnSelectJob;
        jobDeleted: JobDeleted;
    }
}