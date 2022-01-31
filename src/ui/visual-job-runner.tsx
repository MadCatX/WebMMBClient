/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { JobControls } from './job-controls';
import { JobStatus } from './job-status';
import { Viewer } from './viewer';
import { ErrorBox } from './common/error-box';
import { LabeledField } from './common/controlled/labeled-field';
import { JsonCommandsSerializer } from '../mmb/commands-serializer';
import { MmbInputSimple } from './mmb/mmb-input-simple';
import { MmbInputAdvanced } from './mmb/mmb-input-advanced';
import { MmbInputDensityFit } from './mmb/mmb-input-density-fit';
import { MmbInputRaw } from './mmb/mmb-input-raw';
import * as Api from '../mmb/api';
import { JobQuery } from '../mmb/job-query';
import { Query } from '../mmb/query';
import { Conversion } from '../model/conversion';
import { Mmb } from '../model/mmb';
import { MmbSetup } from '../model/mmb/mmb-setup';
import { StagesSpan } from '../model/mmb/stages-span';
import { AdditionalFile } from '../model/mmb/additional-file';
import { Net } from '../util/net';

const DefaultAutoRefreshEnabled = true;
const DefaultAutoRefreshInterval = 10;
const ModeLField = LabeledField.ComboBox<Mmb.SyntheticModes | Mmb.RawModes>();

function forceResize() {
    const elem = document.getElementById('viewer');
    if (elem) {
        const forceResize = new Event('resize', { bubbles: true });
        elem.dispatchEvent(forceResize);
    }
}

interface State {
    jobName: string;
    jobState: Api.JobState;
    jobStep: Api.JobStep;
    jobTotalSteps: Api.JobTotalSteps;
    jobCurrentStage: number|null;
    jobCommandsMode: Api.JobCommandsMode;
    jobError: string;
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    mmbOutput: Viewer.MmbOutput;
    rawCommands: string;
    startJobError: string[];
    uiMode: Mmb.SyntheticModes | Mmb.RawModes;
}

export class VisualJobRunner extends React.Component<VisualJobRunner.Props, State> {
    private commandsQueryAborter: AbortController | null = null;
    private additionalFilesAborter: AbortController | null = null;
    private jobQueryAborter: AbortController | null = null;
    private startJobAborter: AbortController | null = null;
    private stopJobAborter: AbortController | null = null;
    private autoRefresherId: number | null = null;
    private setup: MmbSetup = new MmbSetup();

    constructor(props: VisualJobRunner.Props) {
        super(props);

        this.state = {
            jobName: '',
            jobState: 'NotStarted',
            jobStep: 'none',
            jobTotalSteps: 'none',
            jobCurrentStage: null,
            jobCommandsMode: 'None',
            jobError: '',
            autoRefreshEnabled: true,
            autoRefreshInterval: 10,
            mmbOutput: { text: undefined, errors: undefined },
            rawCommands: '',
            startJobError: [],
            uiMode: 'standard-simple',
        };

        this.onAutoRefreshChanged = this.onAutoRefreshChanged.bind(this);
        this.refreshJob = this.refreshJob.bind(this);
    }

    private densityMap(): { url: string, format: Viewer.DensityMapFormat }|undefined {
        if (this.state.uiMode === 'density-fit') {
            return {
                url: `/density/${this.props.username}/${this.props.jobId}`,
                format: 'ccp4',
            };
        } else
            return void 0;
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
        let obj = {
            jobName: data.name,
            jobState: data.state,
            jobCommandsMode: data.commands_mode,
            jobError: '',
        };
        if (data.progress)
            obj = Object.assign({ jobStep: data.progress.step, jobTotalSteps: data.progress.total_steps }, obj);
        return obj;
    }

    private killAutoRefresh() {
        if (this.autoRefresherId !== null) {
            window.clearInterval(this.autoRefresherId);
            this.autoRefresherId = null;
        }
    }

    private makeMmbInputForm() {
        const stagesList = new Array<number>();
        if (this.state.uiMode === 'density-fit') {
            stagesList.push(2); // Density fit job requires stage to be 2
            this.setup.set('stage', 2);
        } else {
            const s = this.setup.stages;
            for (let n = 1; n <= s.last; n++)
                stagesList.push(n);
            stagesList.push(s.last + 1);
            this.setup.set('stage', s.last + 1);
        }

        switch (this.state.uiMode) {
        case 'standard-simple':
            return (
                <MmbInputSimple
                    availableStages={stagesList}
                    setup={this.setup}
                />
            );
        case 'standard-advanced':
            return (
                <MmbInputAdvanced
                    availableStages={stagesList}
                    jobId={this.props.jobId}
                    setup={this.setup}
                />
            );
        case 'density-fit':
            return (
                <MmbInputDensityFit
                    availableStages={stagesList}
                    jobId={this.props.jobId}
                    setup={this.setup}
                />
            );
        case 'maverick':
            return (
                <MmbInputRaw
                    commands={this.state.rawCommands}
                    onChanged={v => this.setState({ ...this.state, rawCommands: v })}
                />
            );
        }
    }

    private makeMmbInputBlock() {
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
                                { value: 'standard-simple', caption: 'Simple' },
                                { value: 'standard-advanced', caption: 'Advanced' },
                                { value: 'density-fit', caption: 'Density fit' },
                                { value: 'maverick', caption: 'Maverick' },
                            ]
                        }
                        updateNotifier={uiMode => this.setState({ ...this.state, uiMode })} />
                </div>
                {this.makeMmbInputForm()}
            </>
        );
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

            const qCommands = JobQuery.commands(this.props.jobId);
            this.commandsQueryAborter = qCommands.aborter;
            const commandsPromise = qCommands.performer();

            const mmbOutput = await mmbOutputPromise;
            const additionalFiles = await additionalFilesPromise;
            const commands = await commandsPromise;

            let newState: Partial<State> = {
                jobName: jobInfo.name,
                jobState: jobInfo.state,
                jobCommandsMode: jobInfo.commands_mode,
                jobError: '',
            };

            if (!commands || commands.mode === 'None')
                Mmb.setDefaultSetup(this.setup);
            else if (commands.mode === 'Synthetic') {
                const files: AdditionalFile[] = [];
                if (additionalFiles) {
                    for (const f of additionalFiles) {
                        const size = parseInt(f.size);
                        files.push(AdditionalFile.fromInfo(f.name, size));
                    }
                }
                const stages = new StagesSpan(jobInfo.first_stage, jobInfo.last_stage);
                const ret = Conversion.setupFromCommands(this.setup, commands.commands, stages, files);
                if (Conversion.isErrorResult(ret)) {
                    const err = ret.errors.reduce((s, l) => s += `${l}\n`);
                    throw new Error(err);
                }
            } else if (commands.mode === 'Raw')
                newState = { ...newState, rawCommands: commands.commands };

            if (mmbOutput)
                newState = { ...newState, ...this.mmbOutputOkBlock(mmbOutput) };

            this.setState({
                ...this.state,
                ...newState,
            });

            if (jobInfo.state === 'Running')
                this.setupAutoRefresh(this.state.autoRefreshEnabled, this.state.autoRefreshInterval, 'Running');
        } catch (e) {
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock((e as Error).toString()),
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
                    ...this.jobInfoOkBlock(jobInfo),
                    ...this.mmbOutputErrorBlock((e as Error).toString()),
                });
            }
        } catch (e) {
            // Failure when fetching JobInfo
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock((e as Error).toString()),
            });
        }
    }

    private refreshJob() {
        this.queryJobStatus();
    }

    private async startJob() {
        if (this.state.jobState === 'Running') {
            this.setState({
                ...this.state,
                jobError: 'Job is already running',
            });
            return;
        }

        Net.abortFetch(this.startJobAborter);

        if (Mmb.isSyntheticMode(this.state.uiMode)) {
            const result = Conversion.setupToParameters(this.setup, this.state.uiMode);
            if (Conversion.isErrorResult(result)) {
                this.setState({ ...this.state, startJobError: result.errors });
                return;
            }

            const errors = Mmb.isSetupStartable(this.setup, this.state.uiMode);
            if (errors) {
                this.setState({ ...this.state, startJobError: errors });
                return;
            }

            const task = JobQuery.start(this.props.jobId, JsonCommandsSerializer.serialize(result.data));
            this.startJobCommon(task);
        } else {
            const task = JobQuery.startRaw(this.props.jobId, this.state.rawCommands);
            this.startJobCommon(task);
        }
    }

    private async startJobCommon(task: Query.Query<Api.Empty>) {
        this.startJobAborter = task.aborter;

        try {
            const start = await task.performer();
            if (!start)
                return;
            this.setupAutoRefresh(this.state.autoRefreshEnabled, this.state.autoRefreshInterval, 'Running');

            const task2 = JobQuery.fetchInfo(this.props.jobId);
            this.startJobAborter = task2.aborter;
            const jobInfo = await task2.performer();
            if (!jobInfo)
                return;

            this.setState({
                ...this.state,
                ...this.jobInfoOkBlock(jobInfo),
                startJobError: [],
            });
        } catch (e) {
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock((e as Error).toString(), 'none', 'none'),
                startJobError: [],
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

    private async stopJob() {
        this.killAutoRefresh();

        Net.abortFetch(this.stopJobAborter);

        const task = JobQuery.stop(this.props.jobId);
        this.stopJobAborter = task.aborter;

        try {
            const stop = await task.performer();
            if (!stop)
                return;

            const task2 = JobQuery.fetchInfo(this.props.jobId);
            this.stopJobAborter = task2.aborter;

            const jobInfo = await task2.performer();
            if (!jobInfo)
                return;

            this.setState({
                ...this.state,
                ...this.jobInfoOkBlock(jobInfo),
            });
        } catch (e) {
            this.setState({
                ...this.state,
                ...this.jobInfoErrorBlock((e as Error).toString()),
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
                this.setState({ ...this.state, uiMode: 'standard-simple' });
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
        this.setup.destroy();
    }

    render() {
        return (
            <div className='job-runner-container'>
                <Viewer
                    densityMap={this.densityMap()}
                    structureUrl={this.structureUrl()}
                    structureName={this.state.jobName}
                    availableStages={this.setup.stages}
                    step={((this.state.jobStep === 'preparing' || this.state.jobState === 'NotStarted') ? 0 : this.state.jobStep) as number}
                    autoRefreshChanged={this.onAutoRefreshChanged}
                    defaultAutoRefreshEnabled={DefaultAutoRefreshEnabled}
                    defaultAutoRefreshInterval={DefaultAutoRefreshInterval}
                    mmbOutput={this.state.mmbOutput}
                />
                <div className='mmb-controls'>
                    <JobStatus
                        state={this.state.jobState}
                        step={this.state.jobStep}
                        totalSteps={this.state.jobTotalSteps}
                        error={this.state.jobError}
                    />
                    {this.makeMmbInputBlock()}
                    <ErrorBox errors={this.state.startJobError} />
                    <JobControls
                        handleStart={() => this.startJob()}
                        handleStatus={() => this.queryJobStatus()}
                        handleStop={() => this.stopJob()}
                        jobState={this.state.jobState}
                    />
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
