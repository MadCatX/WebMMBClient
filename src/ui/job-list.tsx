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
import { Util } from './common/util';
import { jsonCommandsFromJson } from '../mmb/commands';
import * as Api from '../mmb/api';
import { JobQuery } from '../mmb/job-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { isStr } from '../util/json';
import { Net } from '../util/net';

interface JobEntry extends Api.JobInfo {
    ok: boolean,
}

interface State {
    jobs: JobEntry[];
    error: string;
}

function jobListItemToEntry(item: Api.JobListItem): JobEntry {
    if (item.ok) {
        return {
            ok: true,
            ...item.info,
        };
    } else {
        return {
            ok: false,
            id: '',
            name: '',
            state: 'NotStarted',
            step: 0,
            total_steps: 0,
            available_stages: new Array<number>(),
            current_stage: undefined,
            created_on: 0,
            commands_mode: 'Synthetic',
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

    private onDeleteJobClicked(id: string) {
        Net.abortFetch(this.deleteJobAborter);

        const { promise, aborter } = JobQuery.del(id);
        this.deleteJobAborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(aborter))
                    return;

                const r = Response.parse(json, ResponseDeserializers.toEmpty);

                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        error: Util.formatError(resp.status, 'Cannot delete job', r.message),
                    });
                } else {
                    this.refresh();
                    this.props.jobDeleted(id);
                }
            }).catch(e => {
                this.setState({
                    ...this.state,
                    error: Util.formatError(resp.status, 'Cannot delete job', e.toString()),
                });
            });
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                error: Util.formatError(undefined, 'Cannot delete job', e.toString()),
            });
        });
    }

    private onSelectJobClicked(id?: string) {
        if (id === undefined) {
            this.props.onSelectJob(undefined);
            return;
        }

        this.selectJob(id);
    }

    private refresh() {
        Net.abortFetch(this.listJobsAborter);

        const { promise, aborter } = JobQuery.list();
        this.listJobsAborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(aborter))
                    return;

                const r = Response.parse(json, ResponseDeserializers.toJobList);

                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        jobs: [],
                        error: Util.formatError(resp.status, 'Cannot fetch list of jobs', r.message),
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
                    error: Util.formatError(resp.status, 'Cannot fetch list of jobs', e.toString()),
                });
            });
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                jobs: [],
                error: Util.formatError(undefined, 'Cannot fetch list of jobs', e.toString()),
            });
        });
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
                    {sorted.map((e, n) =>
                        <JobItem
                            key={`job-item-${n}`}
                            id={e.id}
                            name={e.name}
                            state={e.state}
                            created_on={e.created_on}
                            notifyCloned={(_id: string) => this.refresh()}
                            onSelect={() => this.onSelectJobClicked(e.id)}
                            onDelete={() => this.onDeleteJobClicked(e.id)} />
                        )}
                </div>
            );
        }
    }

    private selectJob(id: string) {
        const job = this.state.jobs.find(e => e.id === id);
        if (job === undefined)
            throw new Error(`Job ${id} does not exist`);

        Net.abortFetch(this.selectJobAborter);

        const queryFunc = (() => {
            switch (job.commands_mode) {
            case 'Synthetic':
                return JobQuery.commands;
            case 'Raw':
                return JobQuery.commands_raw;
            }
        })();

        const { promise, aborter } = queryFunc(id);
        this.selectJobAborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(aborter))
                    return;

                if (job.commands_mode === 'Synthetic') {
                    const r = Response.parse(json, jsonCommandsFromJson);

                    if (Response.isError(r)) {
                        this.setState({
                            ...this.state,
                            error: Util.formatError(resp.status, 'Cannot select job', r.message),

                        });
                    } else if (Response.isOk(r)) {
                        this.setState({
                            ...this.state,
                            error: '',
                        });
                        this.props.onSelectJob(job, MIM.jsonCommandsToValues(job.name, job.available_stages, r.data));
                    }
                } else {
                    const r = Response.parse(
                                json,
                                (v: unknown): string => {
                                    if (!isStr(v))
                                        throw new Error('Object is not a string');
                                    return v;
                                }
                              );

                    if (Response.isError(r)) {
                        this.setState({
                            ...this.state,
                            error: Util.formatError(resp.status, 'Cannot select job', r.message),

                        });
                    } else if (Response.isOk(r)) {
                        this.setState({
                            ...this.state,
                            error: '',
                        });
                        this.props.onSelectJob(job, MIM.rawCommandsToValues(job.name, job.available_stages, r.data));
                    }
                }
            }).catch(e => {
                this.setState({
                    ...this.state,
                    error: Util.formatError(resp.status, 'Cannot select job', e.toString()),
                });
            });
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                error: Util.formatError(undefined, 'Cannot select job', e.toString()),
            });
        });
    }

    componentDidMount() {
        this.refresh();
    }

    componentWillUnmount() {
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
                <PushButton
                    className='pushbutton-common pushbutton-default pushbutton-clr-default pushbutton-hclr-green'
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
        (info?: Api.JobInfo, setup?: MIM.Values): void;
    }

    export interface Props {
        onSelectJob: OnSelectJob;
        jobDeleted: JobDeleted;
    }
}