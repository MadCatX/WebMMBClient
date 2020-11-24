/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { JobControls } from './job-controls';
import { JobStatus } from './job-status';
import { MmbInputForm } from './mmb-input-form';
import { MmbInputUtil as MmbUtil } from './mmb-input-form-util';
import { Viewer } from './viewer';
import * as Api from '../mmb/api';
import { JsonCommands } from '../mmb/commands';
import { JobQuery } from '../mmb/job-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';
import { JsonCommandsDeserializer } from '../mmb/commands-deserializer';

const DefaultAutoRefreshEnabled = true;
const DefaultAutoRefreshInterval = 10;

interface State {
    jobId?: string;
    jobName?: string;
    jobState: Api.JobState;
    jobStep: Api.JobStep;
    jobTotalSteps: Api.JobTotalSteps;
    jobLastCompletedStage: number,
    jobError: string;
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    autoRefresherId: number | null;
    mmbOutput: Viewer.MmbOutput;
}

export class VisualJobRunner extends React.Component<VisualJobRunner.Props, State> {
    private mmbInputFormRef: React.RefObject<MmbInputForm>;

    constructor(props: VisualJobRunner.Props) {
        super(props);

        this.state = {
            jobId: props.info?.id,
            jobName: props.info?.name,
            jobState: props.info?.state ?? 'NotStarted',
            jobStep: props.info?.step ?? 'none',
            jobTotalSteps: props.info?.total_steps ?? 'none',
            jobLastCompletedStage: props.info?.last_completed_stage ?? 0,
            jobError: '',
            autoRefreshEnabled: true,
            autoRefreshInterval: 10,
            autoRefresherId: null,
            mmbOutput: { text: undefined, errors: undefined },
        };

        this.onAutoRefreshChanged = this.onAutoRefreshChanged.bind(this);
        this.queryJobStatus = this.queryJobStatus.bind(this);
        this.refreshJob = this.refreshJob.bind(this);
        this.startJob = this.startJob.bind(this);
        this.stopJob = this.stopJob.bind(this);

        this.mmbInputFormRef = React.createRef();
    }

    private handleJobInfoError(e: Error) {
        this.setState({
            ...this.state,
            jobError: e.toString(),
        });
    }

    private handleMmbOutputError(e: Error) {
        const out = { text: undefined, errors: [e.toString()] };
        this.setState({
            ...this.state,
            mmbOutput: out
        });
    }

    private handleErrorResponse<T>(resp: Response, e: Response.Error<T>) {
        this.setState({
            ...this.state,
            jobError: `${resp.status} ${e.message}`,
        });
    }

    private handleJobInfo(resp: Response, r: Response.Payload<Api.JobInfo>) {
        if (Response.isError(r)) {
            this.handleErrorResponse(resp, r);
        } else if (Response.isOk(r)) {
            const data = r.data;
            if (data.state !== 'Running' && this.state.autoRefresherId !== null)
                clearInterval(this.state.autoRefresherId);
            this.setState({
                ...this.state,
                jobId: data.id,
                jobName: data.name,
                jobState: data.state,
                jobStep: data.step,
                jobTotalSteps: data.total_steps,
                jobLastCompletedStage: data.last_completed_stage,
                jobError: '',
            });
        }
    }

    private handleMmbOutput(resp: Response, r: Response.Payload<string>) {
        if (Response.isError(r))
            this.handleMmbOutputError(new Error(`${resp.status} ${r.message}`))
        else if (Response.isOk(r)) {
            const out = { text: r.data, errors: undefined };
            this.setState({
                ...this.state,
                mmbOutput: out,
            });
        }
    }

    private makeInitialValues(commands?: JsonCommands, name?: string) {
        const map = new Map<MmbUtil.ValueKeys, MmbUtil.V<MmbUtil.ValueTypes>>();

        if (commands === undefined || name === undefined)
            return map;

        const global = JsonCommandsDeserializer.toGlobal(commands);
        const md = JsonCommandsDeserializer.toMdParams(commands);
        const compounds = JsonCommandsDeserializer.toCompounds(commands);
        const doubleHelices = JsonCommandsDeserializer.toDoubleHelices(commands);
        const baseInteractions = JsonCommandsDeserializer.toBaseInteractions(commands);
        const ntcs = JsonCommandsDeserializer.toNtCs(commands);
        const rep = JsonCommandsDeserializer.toReporting(commands);

        // Global
        map.set('mol-in-gp-reporting-interval', rep.interval);
        map.set('mol-in-gp-num-reports', rep.count);
        map.set('mol-in-gp-bisf', global.baseInteractionScaleFactor);
        map.set('mol-in-gp-temperature', global.temperature);
        map.set('mol-in-gp-def-md-params', md.useDefaults);
        map.set('mol-in-cp-added', compounds);
        map.set('mol-in-bi-added', baseInteractions);
        map.set('mol-in-dh-added', doubleHelices);
        map.set('mol-in-ntcs-added', ntcs);
        map.set('mol-in-job-name', name);

        return map;
    }

    private onAutoRefreshChanged(enabled: boolean, interval: number) {
        if (interval > 0) {
            this.setState({
                ...this.state,
                autoRefreshEnabled: enabled,
                autoRefreshInterval: interval,
            });

            this.setupAutoRefresh(enabled, interval, this.state.jobState);
        }
    }

    private queryJobStatus() {
        if (this.state.jobId === undefined)
            return;

        JobQuery.status(this.state.jobId).then(resp => {
            resp.json().then(json => {
                try {
                    const r = Response.parse<Api.JobInfo>(json, ResponseDeserializers.toJobInfo);
                    this.handleJobInfo(resp, r);
                } catch (e) {
                    this.handleJobInfoError(e)
                }
            }).catch(e => {
                this.handleJobInfoError(e);
            });
        }).catch(e => {
            this.setState({
                ...this.state,
                jobError: e.message,
            });
        });

        JobQuery.mmbOutput(this.state.jobId).then(resp => {
            resp.json().then(json => {
                try {
                    const r = Response.parse<string>(json, ResponseDeserializers.toMmbOutput);
                    this.handleMmbOutput(resp, r);
                } catch (e) {
                    this.handleMmbOutputError(e);
                }
            }).catch(e => {
                this.handleMmbOutputError(e);
            });
        }).catch(e => {
            this.handleMmbOutputError(new Error(e.message));
        });
    }

    private refreshJob() {
        this.queryJobStatus();
    }

    private startJob() {
        if (this.mmbInputFormRef.current === null)
            return;

        if (this.state.jobState === 'Running') {
            this.setState({
                ...this.state,
                jobError: 'Job is already running',
            });
            return;
        }

        const resume = this.state.jobLastCompletedStage > 0 && this.state.jobId !== undefined;
        const func = resume ? JobQuery.resume : JobQuery.start;

        try {
            const {name, commands} = this.mmbInputFormRef.current.commandsToJob(this.state.jobLastCompletedStage);
            const fid = resume ? this.state.jobId! : name;
            func(fid, commands).then(resp => {
                resp.json().then(json => {
                    try {
                        const r = Response.parse<Api.JobInfo>(json, ResponseDeserializers.toJobInfo);
                        this.handleJobInfo(resp, r);

                        if (Response.isOk(r)) {
                            this.setupAutoRefresh(this.state.autoRefreshEnabled, this.state.autoRefreshInterval, 'Running');
                            this.props.onJobStarted(r.data, commands);
                        }
                    } catch (e) {
                        this.handleJobInfoError(e);
                    }
                });
            }).catch(e => {
                this.setState({
                    ...this.state,
                    jobState: 'Failed',
                    jobStep: 'none',
                    jobTotalSteps: 'none',
                    jobError: e.message,
                });
            });
            console.log(commands);
        } catch (e) {
            this.handleJobInfoError(new Error(e.message));
        }
    }

    private setupAutoRefresh(enabled: boolean, interval: number, state: Api.JobState) {
        if (this.state.autoRefresherId !== null)
            clearInterval(this.state.autoRefresherId);

        if (enabled && state === 'Running') {
            const id = setInterval(this.refreshJob, interval * 1000);
            this.setState({...this.state, autoRefresherId: id});
        } else {
            this.setState({...this.state, autoRefresherId: null});
        }
    }

    private stopJob() {
        if (this.state.jobId === undefined)
            return;

        if (this.state.autoRefresherId !== null) {
            clearInterval(this.state.autoRefresherId);
            this.setState({...this.state, autoRefresherId: null});
        }

        JobQuery.stop(this.state.jobId).then(resp => {
            resp.json().then(json => {
                try {
                    const r = Response.parse<Api.JobInfo>(json, ResponseDeserializers.toJobInfo);
                    this.handleJobInfo(resp, r);
                } catch (e) {
                    this.handleJobInfoError(e);
                }
            });
        }).catch(e => {
            this.handleJobInfoError(new Error(e.message));
        });
    }

    private structureUrl() {
        if (this.state.jobId === undefined)
            return undefined;

        return `/structure/${this.props.username}/${this.state.jobId}`;
    }

    render() {
        return (
            <>
                <div>
                    <Viewer
                        structureUrl={this.structureUrl()}
                        structureName={this.state.jobName}
                        stage={'last'}
                        autoRefreshChanged={this.onAutoRefreshChanged}
                        defaultAutoRefreshEnabled={DefaultAutoRefreshEnabled}
                        defaultAutoRefreshInterval={DefaultAutoRefreshInterval}
                        mmbOutput={this.state.mmbOutput} />
                </div>
                <div id='mmb-controls'>
                    <JobStatus
                        state={this.state.jobState}
                        step={this.state.jobStep}
                        totalSteps={this.state.jobTotalSteps}
                        error={this.state.jobError} />
                    <MmbInputForm
                        ref={this.mmbInputFormRef}
                        id='molecule-input'
                        jobName={this.props.info?.name}
                        initialValues={this.makeInitialValues(this.props.commands, this.props.info?.name)} />
                    <JobControls
                        handleStart={this.startJob}
                        handleStatus={this.queryJobStatus}
                        handleStop={this.stopJob}
                        jobState={this.state.jobState} />
                </div>
            </>
        );
    }
}

export namespace VisualJobRunner {
    export interface OnJobStarted {
        (info: Api.JobInfo, commands: JsonCommands): void;
    }

    export interface ActiveJob {
        info: Api.JobInfo;
        commands: JsonCommands;
    }

    export interface Props {
        onJobStarted: OnJobStarted;
        username: string;
        info?: Api.JobInfo;
        commands?: JsonCommands;
    }
}
