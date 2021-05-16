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
import { LabeledField } from './common/controlled/labeled-field';
import * as Api from '../mmb/api';
import { JobQuery } from '../mmb/job-query';
import { Query } from '../mmb/query';
import { AdditionalFile } from '../model/additional-file';
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
    jobId: string;
    jobName: string;
    jobState: Api.JobState;
    jobStep: Api.JobStep;
    jobTotalSteps: Api.JobTotalSteps;
    jobAvailableStages: number[];
    jobCurrentStage: number|null;
    jobCommandsMode: Api.JobCommandsMode;
    jobError: string;
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    mmbOutput: Viewer.MmbOutput;
    uiMode: MIM.UiMode;
    setup: Map<MIM.ValueKeys, MIM.V<MIM.ValueTypes>>;
}

export class VisualJobRunner extends React.Component<VisualJobRunner.Props, State> {
    private mmbInputFormRef: React.RefObject<MmbInputForm>;
    private commandsQueryAborter: AbortController | null = null;
    private additionalFilesAborter: AbortController | null = null;
    private jobQueryAborter: AbortController | null = null;
    private startJobAborter: AbortController | null = null;
    private stopJobAborter: AbortController | null = null;
    private autoRefresherId: number | null = null;

    constructor(props: VisualJobRunner.Props) {
        super(props);

        this.state = {
            jobId: '',
            jobName: '',
            jobState: 'NotStarted',
            jobStep: 'none',
            jobTotalSteps: 'none',
            jobAvailableStages: [],
            jobCurrentStage: null,
            jobCommandsMode: 'None',
            jobError: '',
            autoRefreshEnabled: true,
            autoRefreshInterval: 10,
            mmbOutput: { text: undefined, errors: undefined },
            uiMode: 'simple',
            setup: MIM.defaultSetupValues(),
        };


        this.makeMmbInputForm = this.makeMmbInputForm.bind(this);
        this.onAutoRefreshChanged = this.onAutoRefreshChanged.bind(this);
        this.refreshJob = this.refreshJob.bind(this);

        this.mmbInputFormRef = React.createRef();
    }

    private jobInfoErrorBlock(errorMsg: string, step?: Api.JobStep, totalSteps?: Api.JobTotalSteps) {
        let obj = { jobState: 'Failed' as Api.JobState, jobError: errorMsg};
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
            jobCurrentStage: data.current_stage,
            jobCommandsMode: data.commands_mode,
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
                        jobId={this.state.jobId}
                        jobName={this.state.jobName}
                        availableStages={stages}
                        currentStage={this.state.jobCurrentStage}
                        mode={this.state.uiMode}
                        initialValues={this.state.setup} />
                </>
            );
        } catch (e) {
            return (
                <ErrorBox
                    errors={[`Invalid job parameters: ${e.toString()}`]} />
            );
        }
    }

    private mmbOutputErrorBlock(err: string) {
        return { mmbOutput: { text: undefined, errors: [err] } };
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

    private async queryJobInitial() {
        Net.abortFetch(this.jobQueryAborter);

        try {
            const taskInfo = JobQuery.fetchInfo(this.props.jobId);
            this.jobQueryAborter = taskInfo.aborter;

            const jobInfo = await taskInfo.performer();
            if (!jobInfo)
                return; // TODO: Report an error?

            const qMmbOutput = JobQuery.fetchMmbOutput(jobInfo.id);
            this.jobQueryAborter = qMmbOutput.aborter;
            const mmbOutputPromise = qMmbOutput.performer();

            const qAdditionalFiles = JobQuery.listAdditionalFiles(jobInfo.id);
            this.additionalFilesAborter = qAdditionalFiles.aborter;
            const additionalFilesPromise = qAdditionalFiles.performer();

            const qCommands = jobInfo.commands_mode === 'Raw' ? JobQuery.commandsRaw(this.props.jobId) : JobQuery.commands(this.props.jobId);
            this.commandsQueryAborter = qCommands.aborter;
            const commandsPromise = qCommands.performer();

            const mmbOutput = await mmbOutputPromise;
            const additionalFiles = await additionalFilesPromise;
            const commands = await commandsPromise;
            const setup = (() => {
                if (!commands || commands.is_empty)
                    return MIM.defaultSetupValues();

                const files: AdditionalFile[] = [];
                if (additionalFiles) {
                    for (const f of additionalFiles) {
                        const size = parseInt(f.size);
                        files.push(AdditionalFile.fromInfo(f.name, size));
                    }
                }

                if (jobInfo.commands_mode === 'Raw')
                    return MIM.rawCommandsToValues(jobInfo.name, jobInfo.available_stages, (commands as Api.JobCommandsRaw).commands!, files);
                return MIM.jsonCommandsToValues(jobInfo.name, jobInfo.available_stages, (commands as Api.JobCommands).commands!, files);
            })();

            let newState: Partial<State> = { ...this.jobInfoOkBlock(jobInfo) };
            if (mmbOutput)
                newState = { ...newState, ...this.mmbOutputOkBlock(mmbOutput) };

            if (commands)
                newState = { ...newState, setup };

            this.setState({
                ...this.state,
                ...newState,
            });

            if (jobInfo.state === 'Running')
                this.setupAutoRefresh(this.state.autoRefreshEnabled, this.state.autoRefreshInterval, 'Running');
        } catch (e) {
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock(e),
            });
        }
    }

    private async queryJobStatus() {
        Net.abortFetch(this.jobQueryAborter);

        const task = JobQuery.fetchInfo(this.props.jobId);
        this.jobQueryAborter = task.aborter;

        try {
            const jobInfo = await task.performer();
            if (!jobInfo)
                return;

            try {
                const task2 = JobQuery.fetchMmbOutput(this.props.jobId);
                this.jobQueryAborter = task2.aborter;

                const mmbOutput = await task2.performer();
                if (!mmbOutput) {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoOkBlock(jobInfo),
                    });
                } else {
                    this.setState({
                        ...this.state,
                        ...this.jobInfoOkBlock(jobInfo),
                        ...this.mmbOutputOkBlock(mmbOutput),
                    });
                }
            } catch (e) {
                // Failure when fetching MMB output
                this.setState({
                    ...this.state,
                    ...this.mmbOutputErrorBlock(e.toString())
                });
            }
        } catch (e) {
            // Failure when fetching JobInfo
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock(e.toString()),
            })
        }
    }

    private refreshJob() {
        this.queryJobStatus();
    }

    private async startJob() {
        if (this.mmbInputFormRef.current === null)
            return;

        if (this.state.jobState === 'Running') {
            this.setState({
                ...this.state,
                jobError: 'Job is already running',
            });
            return;
        }

        Net.abortFetch(this.startJobAborter);

        const commands = await this.mmbInputFormRef.current.commandsToJob();
        const task = JobQuery.start(this.props.jobId, commands);

        this.startJobCommon(task);
    }

    private async startJobCommon(task: Query.Query<Api.JobInfo>) {
        this.startJobAborter = task.aborter;

        try {
            const jobInfo = await task.performer();
            if (!jobInfo)
                return;
            this.setupAutoRefresh(this.state.autoRefreshEnabled, this.state.autoRefreshInterval, 'Running');
            this.setState({
                ...this.state,
                ...this.jobInfoOkBlock(jobInfo),
            });
        } catch (e) {
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock(e.toString(), 'none', 'none'),
            });
        }
    }

    private startJobRaw() {
        if (this.mmbInputFormRef.current === null)
            return;

        if (this.state.jobState === 'Running') {
            this.setState({
                ...this.state,
                jobError: 'Job is already running',
            });
            return;
        }

        Net.abortFetch(this.startJobAborter);

        const commands = this.mmbInputFormRef.current.rawCommandsToJob();
        const task = JobQuery.startRaw(this.props.jobId, commands);

        this.startJobCommon(task);
    }

    private setupAutoRefresh(enabled: boolean, interval: number, state: Api.JobState) {
        this.killAutoRefresh();

        if (enabled && state === 'Running')
            this.autoRefresherId = window.setInterval(this.refreshJob, interval * 1000);
        else
            this.autoRefresherId = null;
    }

    private async stopJob() {
        this.killAutoRefresh();

        Net.abortFetch(this.stopJobAborter);

        const task = JobQuery.stop(this.props.jobId);
        this.stopJobAborter = task.aborter;

        try {
            const jobInfo = await task.performer();
            if (!jobInfo)
                return;
            this.setState({
                ...this.state,
                ...this.jobInfoOkBlock(jobInfo),
            });
        } catch (e) {
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock(e.toString()),
            });
        }
    }

    private structureUrl() {
        return `/structure/${this.props.username}/${this.props.jobId}`;
    }

    componentDidMount() {
        this.queryJobInitial();

        forceResize();
    }

    componentDidUpdate(prevProps: VisualJobRunner.Props) {
        if (this.state.jobState !== 'Running')
            this.killAutoRefresh();

        if (this.props.jobId !== prevProps.jobId) {
            this.killAutoRefresh();
            this.queryJobInitial();
            return;
        }

        switch (this.state.jobCommandsMode) {
            case 'Raw':
                if (this.state.uiMode !== 'maverick')
                    this.setState({ ...this.state, uiMode: 'maverick' });
                break;
            case 'Synthetic':
                if (this.state.uiMode === 'maverick')
                    this.setState({ ...this.state, uiMode: 'simple' });
                break;
        }
    }

    componentWillUnmount() {
        Net.abortFetch(this.commandsQueryAborter);
        Net.abortFetch(this.additionalFilesAborter);
        Net.abortFetch(this.jobQueryAborter);
        Net.abortFetch(this.startJobAborter);
        Net.abortFetch(this.stopJobAborter);

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
                        handleStart={() => {
                            switch (this.state.uiMode) {
                                case 'maverick':
                                    this.startJobRaw();
                                    break;
                                default:
                                    this.startJob();
                                    break;
                            }
                        }}
                        handleStatus={() => this.queryJobStatus}
                        handleStop={() => this.stopJob}
                        jobState={this.state.jobState} />
                </div>
            </div>
        );
    }
}

export namespace VisualJobRunner {
    export interface Props {
        username: string;
        jobId: string;
    }
}
