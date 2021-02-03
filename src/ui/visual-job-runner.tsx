/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { JobControls } from './job-controls';
import { JobStatus } from './job-status';
import { MmbInputForm } from './mmb-input-form';
import { Viewer } from './viewer';
import { ErrorBox } from './common/error-box';
import { Util } from './common/util';
import { LabeledField } from './common/controlled/labeled-field';
import * as Api from '../mmb/api';
import { JobQuery } from '../mmb/job-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { Net } from '../util/net';

const DefaultAutoRefreshEnabled = true;
const DefaultAutoRefreshInterval = 10;
const ModeLField = LabeledField.ComboBox<MIM.UiMode>();
const UiModeMessage = {
    simple: '',
    advanced: 'Warning: Be aware that any changes made here will not be erased if you switch back to simple mode.',
    maverick: 'Warning: Commands entered in this mode will be submitted directly to MMB with no additional validation. You are on a highway to the danger zone unless you know what you are doing.',
};

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
    uiMode: MIM.UiMode;
}

export class VisualJobRunner extends React.Component<VisualJobRunner.Props, State> {
    private mmbInputFormRef: React.RefObject<MmbInputForm>;
    private jobQueryAborter: AbortController | null = null;
    private startJobAborter: AbortController | null = null;
    private stopJobAborter: AbortController | null = null;
    private autoRefresherId: number | null = null;

    constructor(props: VisualJobRunner.Props) {
        super(props);

        const step = (props.info?.state === 'NotStarted' ? 'none' : (props.info?.step ?? 'none')) ?? 'none';

        this.state = {
            jobId: props.info?.id,
            jobName: props.info?.name,
            jobState: props.info?.state ?? 'NotStarted',
            jobStep: step,
            jobTotalSteps: props.info?.total_steps ?? 'none',
            jobAvailableStages: props.info?.available_stages ?? new Array<number>(),
            jobError: '',
            autoRefreshEnabled: true,
            autoRefreshInterval: 10,
            mmbOutput: { text: undefined, errors: undefined },
            uiMode: 'simple',
        };

        this.makeMmbInputForm = this.makeMmbInputForm.bind(this);
        this.onAutoRefreshChanged = this.onAutoRefreshChanged.bind(this);
        this.queryJobStatus = this.queryJobStatus.bind(this);
        this.refreshJob = this.refreshJob.bind(this);
        this.startJob = this.startJob.bind(this);
        this.stopJob = this.stopJob.bind(this);

        this.mmbInputFormRef = React.createRef();
    }

    private jobInfoErrorBlock(status: number|undefined, errorPrefix: string, errorMessage: string, step?: Api.JobStep, totalSteps?: Api.JobTotalSteps) {
        let obj = { jobState: 'Failed' as Api.JobState, jobError: Util.formatError(status, errorPrefix, errorMessage) };
        if (step !== undefined)
            obj = Object.assign({ jobStep: step }, obj);
        if (totalSteps !== undefined)
            obj = Object.assign({ jobTotalSteps: totalSteps }, obj);
        return obj;
    }

    private jobInfoOkBlock(data: Api.JobInfo) {
        const step = data.state === 'NotStarted' ? 'none' : data.step;
        return {
            jobId: data.id,
            jobName: data.name,
            jobState: data.state,
            jobStep: step,
            jobTotalSteps: data.total_steps,
            jobAvailableStages: data.available_stages,
            jobError: '',
        };
    }

    private killAutoRefresh() {
        if (this.autoRefresherId !== null) {
            window.clearInterval(this.autoRefresherId);
            this.autoRefresherId = null;
        }
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

            return (
                <>
                    <div className='ui-mode-container'>
                        <ModeLField
                            id='mmb-in-ui-mode'
                            label='User interface mode'
                            style='left'
                            value={this.state.uiMode}
                            options={
                                [
                                    { value: 'simple', caption: 'Simple' },
                                    { value: 'advanced', caption: 'Advanced' },
                                    { value: 'maverick', caption: 'Maverick' },
                                ]
                            }
                            updateNotifier={uiMode => this.setState({ ...this.state, uiMode })} />
                        <div className='warning-message'>{UiModeMessage[this.state.uiMode]}</div>
                    </div>
                    <MmbInputForm
                        ref={this.mmbInputFormRef}
                        jobName={this.props.info?.name}
                        availableStages={stages}
                        mode={this.state.uiMode}
                        initialValues={this.props.setup} />
                </>
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
                const r = Response.parse(json, ResponseDeserializers.toJobInfo);

                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoErrorBlock(resp.status, 'Cannot query job info', r.message),
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

                        const r2 = Response.parse(json, ResponseDeserializers.toMmbOutput);
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
                    ...this.jobInfoErrorBlock(resp.status, 'Cannot query job info', e.toString()),
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
            Net.abortFetch(this.startJobAborter);

            const { promise, aborter } = (() => {
                if (this.state.uiMode === 'maverick') {
                    const { name, commands } = this.mmbInputFormRef.current.rawCommandsToJob();
                    console.log(commands);

                    return JobQuery.startRaw(name, commands);
                } else {
                    const { name, commands } = this.mmbInputFormRef.current.commandsToJob();
                    console.log(commands);

                    return JobQuery.start(name, commands);
                }
            })();

            this.startJobAborter = aborter;
            promise.then(resp => {
                resp.json().then(json => {
                    if (Net.isFetchAborted(aborter))
                        return;

                    const r = Response.parse(json, ResponseDeserializers.toJobInfo);

                    if (Response.isError(r))
                        throw new Error(r.message);
                    else if (Response.isOk(r)) {
                        this.setupAutoRefresh(this.state.autoRefreshEnabled, this.state.autoRefreshInterval, 'Running');
                        this.setState({
                            ...this.state,
                            ...this.jobInfoOkBlock(r.data)
                        });
                        this.props.onJobStarted(r.data, this.mmbInputFormRef.current!.getValues());
                    }
                }).catch(e => {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoErrorBlock(resp.status, 'Cannot start job', e.toString(), 'none', 'none'),
                    });
                });
            }).catch(e => {
                this.setState({
                    ...this.state,
                    ...this.jobInfoErrorBlock(undefined, 'Cannot start job', e.toString(), 'none', 'none'),
                });
            });
        } catch (e) {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock(undefined, 'Cannot start job', e.message, 'none', 'none'),
            });
        }
    }

    private setupAutoRefresh(enabled: boolean, interval: number, state: Api.JobState) {
        this.killAutoRefresh();

        if (enabled && state === 'Running')
            this.autoRefresherId = window.setInterval(this.refreshJob, interval * 1000);
        else
            this.autoRefresherId = null;
    }

    private stopJob() {
        if (this.state.jobId === undefined)
            return;

        this.killAutoRefresh();

        Net.abortFetch(this.stopJobAborter);

        const { promise, aborter } = JobQuery.stop(this.state.jobId);
        this.stopJobAborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(aborter))
                    return;

                const r = Response.parse(json, ResponseDeserializers.toJobInfo);
                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoErrorBlock(resp.status, 'Cannot stop job', r.message),
                    });
                } else if (Response.isOk(r)) {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoOkBlock(r.data),
                    });
                }
            });
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock(undefined, 'Cannot stop job', e.toString()),
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
        if (this.state.jobState === 'Running')
            this.setupAutoRefresh(this.state.autoRefreshEnabled, this.state.autoRefreshInterval, 'Running');

        forceResize();
    }

    componentDidUpdate(_prevProps: VisualJobRunner.Props) {
        if (this.state.jobState !== 'Running')
            this.killAutoRefresh();
        if (this.props.info !== undefined) {
            switch (this.props.info.commands_mode) {
            case 'Raw':
                if (this.state.uiMode !== 'maverick')
                    this.setState({ ...this.state, uiMode: 'maverick' });
                break;
            case 'Synthetic':
                if (this.state.uiMode === 'maverick')
                        this.setState({ ...this.state, uiMode: 'simple' });
            }
        }
    }

    componentWillUnmount() {
        Net.abortFetch(this.jobQueryAborter);
        Net.abortFetch(this.startJobAborter);
        Net.abortFetch(this.startJobAborter);

        this.killAutoRefresh();
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
        (info: Api.JobInfo, setup: MIM.Values): void;
    }

    export interface Props {
        onJobStarted: OnJobStarted;
        username: string;
        setup: MIM.Values;
        info?: Api.JobInfo;
    }
}
