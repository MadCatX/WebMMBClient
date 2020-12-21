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
import { ErrorBox } from './common/error-box';
import * as Api from '../mmb/api';
import { JsonCommands } from '../mmb/commands';
import { JobQuery } from '../mmb/job-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';
import { JsonCommandsDeserializer } from '../mmb/commands-deserializer';
import { Net } from '../util/net';

const DefaultAutoRefreshEnabled = true;
const DefaultAutoRefreshInterval = 10;

function forceResize() {
    const elem = document.getElementById('viewer');
    if (elem) {
        const forceResize = new Event('resize', { bubbles: true });
        elem.dispatchEvent(forceResize);
    }
}

interface State {
    jobId?: string;
    jobName?: string;
    jobState: Api.JobState;
    jobStep: Api.JobStep;
    jobTotalSteps: Api.JobTotalSteps;
    jobAvailableStages: number[];
    jobError: string;
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    mmbOutput: Viewer.MmbOutput;
}

export class VisualJobRunner extends React.Component<VisualJobRunner.Props, State> {
    private mmbInputFormRef: React.RefObject<MmbInputForm>;
    private jobQueryAborter: AbortController | null = null;
    private startJobAborter: AbortController | null = null;
    private stopJobAborter: AbortController | null = null;
    private autoRefresherId: number | null = null;

    constructor(props: VisualJobRunner.Props) {
        super(props);

        this.state = {
            jobId: props.info?.id,
            jobName: props.info?.name,
            jobState: props.info?.state ?? 'NotStarted',
            jobStep: props.info?.step ?? 'none',
            jobTotalSteps: props.info?.total_steps ?? 'none',
            jobAvailableStages: props.info?.available_stages ?? new Array<number>(),
            jobError: '',
            autoRefreshEnabled: true,
            autoRefreshInterval: 10,
            mmbOutput: { text: undefined, errors: undefined },
        };

        this.makeMmbInputForm = this.makeMmbInputForm.bind(this);
        this.onAutoRefreshChanged = this.onAutoRefreshChanged.bind(this);
        this.queryJobStatus = this.queryJobStatus.bind(this);
        this.refreshJob = this.refreshJob.bind(this);
        this.startJob = this.startJob.bind(this);
        this.stopJob = this.stopJob.bind(this);

        this.mmbInputFormRef = React.createRef();
    }

    private jobInfoErrorBlock(e: Error, step?: Api.JobStep, totalSteps?: Api.JobTotalSteps) {
        let obj = { jobState: 'Failed' as Api.JobState, jobError: e.toString() };
        if (step !== undefined)
            obj = Object.assign({ jobStep: step }, obj);
        if (totalSteps !== undefined)
            obj = Object.assign({ jobTotalSteps: totalSteps }, obj);
        return obj;
    }

    private jobInfoOkBlock(data: Api.JobInfo) {
        return {
            jobId: data.id,
            jobName: data.name,
            jobState: data.state,
            jobStep: data.step,
            jobTotalSteps: data.total_steps,
            jobAvailableStages: data.available_stages,
            jobError: '',
        };
    }

    private makeInitialValues(stages: number[], commands?: JsonCommands, name?: string) {
        const map = new Map<MmbUtil.ValueKeys, MmbUtil.V<MmbUtil.ValueTypes>>();

        if (commands === undefined || name === undefined)
            return map;

        const global = JsonCommandsDeserializer.toGlobal(commands);
        const stage = stages[stages.length - 1];
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
        map.set('mol-in-gp-stage', stage);
        map.set('mol-in-cp-added', compounds);
        map.set('mol-in-bi-added', baseInteractions);
        map.set('mol-in-dh-added', doubleHelices);
        map.set('mol-in-ntcs-added', ntcs);
        map.set('mol-in-job-name', name);

        return map;
    }

    private makeMmbInputForm() {
        try {
            const stages = (() => {
                const sorted = [...this.state.jobAvailableStages].sort((a, b) => a - b);
                if (sorted.length === 0)
                    sorted.push(1);
                else {
                    const last = sorted[sorted.length - 1];
                    sorted.push(last + 1);
                }
                return sorted;
            })();
            const initVals = this.makeInitialValues(stages, this.props.commands, this.props.info?.name);
            return (
                <MmbInputForm
                    ref={this.mmbInputFormRef}
                    id='molecule-input'
                    jobName={this.props.info?.name}
                    availableStages={stages}
                    initialValues={initVals} />
            );
        } catch (e) {
            return (
                <ErrorBox
                    errors={[`Invalid job parameters: ${e.toString()}`]} />
            );
        }
    }

    private mmbOutputErrorBlock(e: Error) {
        return { mmbOutput: { text: undefined, errors: [e.toString()] } };
    }

    private mmbOutputOkBlock(data: string) {
        return { mmbOutput: { text: data, errors: undefined } };
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

        Net.abortFetch(this.jobQueryAborter);

        let { promise, aborter } = JobQuery.status(this.state.jobId);
        this.jobQueryAborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(aborter))
                    return;
                const r = Response.parse<Api.JobInfo>(json, ResponseDeserializers.toJobInfo);

                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoErrorBlock(new Error(r.message)),
                    });
                    return;
                }
                if (!Response.isOk(r))
                    throw new Error('Unexpected response payload type');

                // We have basic job status data, now fetch MMB output
                if (this.state.jobId === undefined) {
                    // This should never happen
                    this.setState({
                        ...this.state,
                        ...this.jobInfoOkBlock(r.data),
                    });
                    return;
                }

                ({ promise, aborter } = JobQuery.mmbOutput(this.state.jobId));
                this.jobQueryAborter = aborter;
                promise.then(resp => {
                    resp.json().then(json => {
                        if (Net.isFetchAborted(aborter))
                            return;

                        const r2 = Response.parse<string>(json, ResponseDeserializers.toMmbOutput);
                        if (Response.isError(r2)) {
                            this.setState({
                                ...this.state,
                                ...this.jobInfoOkBlock(r.data),
                            });
                        } else if (Response.isOk(r2)) {
                            console.log(r2.data);
                            this.setState({
                                ...this.state,
                                ...this.jobInfoOkBlock(r.data),
                                ...this.mmbOutputOkBlock(r2.data),
                            });
                        }
                    }).catch(e => {
                        this.setState({
                            ...this.state,
                            ...this.jobInfoOkBlock(r.data),
                            ...this.mmbOutputErrorBlock(e),
                        });
                    });
                }).catch(e => {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoOkBlock(r.data),
                        ...this.mmbOutputErrorBlock(e),
                    });
                });
            }).catch(e => {
                this.setState({
                    ...this.state,
                    ...this.jobInfoErrorBlock(e),
                });
            });
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                jobError: e.message,
            });
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

        try {
            const {name, commands} = this.mmbInputFormRef.current.commandsToJob();

            Net.abortFetch(this.startJobAborter);

            const { promise, aborter } = JobQuery.start(name, commands);
            this.startJobAborter = aborter;
            promise.then(resp => {
                resp.json().then(json => {
                    if (Net.isFetchAborted(aborter))
                        return;

                    const r = Response.parse<Api.JobInfo>(json, ResponseDeserializers.toJobInfo);

                    if (Response.isError(r))
                        throw new Error(r.message);
                    else if (Response.isOk(r)) {
                        this.setupAutoRefresh(this.state.autoRefreshEnabled, this.state.autoRefreshInterval, 'Running');
                        this.setState({
                            ...this.state,
                            ...this.jobInfoOkBlock(r.data)
                        });
                        this.props.onJobStarted(r.data, commands);
                    }
                }).catch(e => {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoErrorBlock(e, 'none', 'none'),
                    });
                });
            }).catch(e => {
                this.setState({
                    ...this.state,
                    ...this.jobInfoErrorBlock(e, 'none', 'none'),
                });
            });
            console.log(commands);
        } catch (e) {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock(new Error(e.message)),
            });
        }
    }

    private setupAutoRefresh(enabled: boolean, interval: number, state: Api.JobState) {
        if (this.autoRefresherId !== null)
            window.clearInterval(this.autoRefresherId);

        if (enabled && state === 'Running')
            this.autoRefresherId = window.setInterval(this.refreshJob, interval * 1000);
        else
            this.autoRefresherId = null;
    }

    private stopJob() {
        if (this.state.jobId === undefined)
            return;

        if (this.autoRefresherId !== null) {
            window.clearInterval(this.autoRefresherId);
            this.autoRefresherId = null;
        }

        Net.abortFetch(this.stopJobAborter);

        const { promise, aborter } = JobQuery.stop(this.state.jobId);
        this.stopJobAborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(aborter))
                    return;

                const r = Response.parse<Api.JobInfo>(json, ResponseDeserializers.toJobInfo);
                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoErrorBlock(new Error(r.message)),
                    });
                } else if (Response.isOk(r)) {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoOkBlock(r.data),
                    })
                }
            });
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock(e),
            });
        });
    }

    private structureUrl() {
        if (this.state.jobId === undefined)
            return undefined;

        return `/structure/${this.props.username}/${this.state.jobId}`;
    }

    componentDidMount() {
        if (this.state.jobId !== undefined)
            this.queryJobStatus();

        forceResize();
    }

    componentDidUpdate(_prevProps: VisualJobRunner.Props, prevState: State) {
        if (prevState.jobState === 'Running' && this.state.jobState !== 'Running')
            this.setupAutoRefresh(false, this.state.autoRefreshInterval, this.state.jobState)
    }

    componentWillUnmount() {
        Net.abortFetch(this.jobQueryAborter);
        Net.abortFetch(this.startJobAborter);
        Net.abortFetch(this.startJobAborter);
    }

    render() {
        return (
            <div className='job-runner-container'>
                <Viewer
                    structureUrl={this.structureUrl()}
                    structureName={this.state.jobName}
                    availableStages={this.state.jobAvailableStages}
                    step={((this.state.jobStep === 'preparing' || this.state.jobState === 'NotStarted') ? 0 : this.state.jobStep) as number}
                    autoRefreshChanged={this.onAutoRefreshChanged}
                    defaultAutoRefreshEnabled={DefaultAutoRefreshEnabled}
                    defaultAutoRefreshInterval={DefaultAutoRefreshInterval}
                    mmbOutput={this.state.mmbOutput} />
                <div className='mmb-controls'>
                    <JobStatus
                        state={this.state.jobState}
                        step={this.state.jobStep}
                        totalSteps={this.state.jobTotalSteps}
                        error={this.state.jobError} />
                    {this.makeMmbInputForm()}
                    <JobControls
                        handleStart={this.startJob}
                        handleStatus={this.queryJobStatus}
                        handleStop={this.stopJob}
                        jobState={this.state.jobState} />
                </div>
            </div>
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
