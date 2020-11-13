import * as React from 'react';
import { JobItem } from './job-item';
import { PushButton } from './common/push-button';
import { JsonCommands, jsonCommandsFromJson } from '../mmb/commands';
import * as Api from '../mmb/api';
import { JobQuery } from '../mmb/job-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';

interface State {
    jobs: Api.JobInfo[];
    error: string;
}

export class JobList extends React.Component<JobList.Props, State> {
    constructor(props: JobList.Props) {
        super(props);

        this.state = {
            jobs: [],
            error: '',
        };

        this.onJobClicked = this.onJobClicked.bind(this);
    }

    componentDidMount() {
        JobQuery.list().then(resp => {
            if (resp.status === 200) {
                resp.json().then(json => {
                    const r = Response.parse<Api.JobInfo[]>(json, ResponseDeserializers.toJobList);

                    if (Response.isError(r)) {
                        this.setState({
                            ...this.state,
                            jobs: [],
                            error: 'Invalid job list data',
                        });
                    } else if (Response.isOk(r)) {
                        this.setState({
                            ...this.state,
                            jobs: r.data,
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
            this.setState({
                ...this.state,
                jobs: [],
                error: `Cannot fetch list of jobs (${e.toString()})`,
            });
        });
    }

    private onJobClicked(id?: string) {
        if (id === undefined) {
            this.props.onJobSelected(undefined);
            return;
        }

        const job = this.state.jobs.find(e => e.id === id);
        if (job === undefined)
            throw new Error(`Job ${id} does not exist`);

        JobQuery.commands(id).then(resp => {
            if (resp.status === 200) {
                resp.json().then(json => {
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
                        this.props.onJobSelected(job, r.data);
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
            this.setState({
                ...this.state,
                error: e.toString(),
            });
        });
    }

    private renderInner() {
        if (this.state.error !== '') {
            return (<div className='error-message'>{this.state.error}</div>);
        } else {
            return (
                this.state.jobs.map((e, n) =>
                    <JobItem
                        key={`job-item-${n}`}
                        id={e.id}
                        name={e.name}
                        status={e.status}
                        onClick={() => this.onJobClicked(e.id)} />
                )
            );
        }
    }

    render() {
        return (
            <div>
                <div className='section-caption'>Jobs</div>
                <div className='job-items-container'>
                    {this.renderInner()}
                </div>
                <PushButton
                    value='+ New job'
                    onClick={() => this.onJobClicked(undefined)} />
            </div>
        );
    }
}

export namespace JobList {
    export interface OnJobSelected {
        (job?: Api.JobInfo, commands?: JsonCommands): void;
    }

    export interface Props {
        onJobSelected: OnJobSelected;
    }
}