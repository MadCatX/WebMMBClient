/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ErrorBox } from './common/error-box';
import { LinkButton } from './common/link-button';
import { PushButton } from './common/push-button';
import { LabeledField } from './common/controlled/labeled-field';
import { Num } from '../util/num';

declare let WebMmbViewer: any;

const StageLField = LabeledField.ComboBox<number>();
const TimeLField = LabeledField.LineEdit<string>();
const ChkLField = LabeledField.CheckBox();

function forceResize() {
    const elem = document.getElementById('viewer');
    if (elem) {
        const forceResize = new Event('resize', { bubbles: true });
        elem.dispatchEvent(forceResize);
    }
}

interface State {
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    selectedStage?: number;
}

export class Viewer extends React.Component<Viewer.Props, State> {
    constructor(props: Viewer.Props) {
        super(props);

        this.state = {
            autoRefreshEnabled: this.props.defaultAutoRefreshEnabled,
            autoRefreshInterval: this.props.defaultAutoRefreshInterval,
        };

        this.renderMmbOutput = this.renderMmbOutput.bind(this);
    }

    private clear() {
        WebMmbViewer.clear();
    }

    private async initAndLoad() {
        await WebMmbViewer.init(document.getElementById('viewer'));
        this.load();
    }

    private async load() {
        const surl = this.structureUrl();
        if (surl !== undefined)
            await WebMmbViewer.loadStructure(surl, 'pdb');
        if (this.props.densityMap)
            await WebMmbViewer.loadDensityMap(this.props.densityMap.url, this.props.densityMap.format);
    }

    private renderMmbOutput() {
        const output = this.props.mmbOutput;

        if (output.text === undefined && output.errors === undefined)
            return undefined;

        return (
            <div className='section'>
                <div className='section-caption'>MMB Output</div>
                {(() => {
                if (output.errors !== undefined)
                    return (<ErrorBox errors={output.errors} />);
                if (output.text !== undefined)
                    return (<pre className='mmb-output' id='mmb-output-item'>{output.text}</pre>);
                })()}
            </div>
        );
    }

    private switchRepresentation(repr: 'ball-and-stick' | 'cartoon') {
        WebMmbViewer.setRepresentation(repr);
    }

    private structureUrl() {
        if (this.props.structureUrl === undefined)
            return undefined;
        const stage = this.state.selectedStage ?? 'last';
        return `./${this.props.structureUrl}/${stage}`;
    }

    componentDidMount() {
        this.initAndLoad();
    }

    componentDidUpdate(prevProps: Viewer.Props, prevState: State) {
        if (this.props.step === 0 && prevProps.step !== 0)
            this.clear();
        else if (this.props.availableStages.length !== prevProps.availableStages.length ||
                 this.props.step !== prevProps.step ||
                 this.state.selectedStage !== prevState.selectedStage)
            this.load();

        if (this.state.autoRefreshInterval !== prevState.autoRefreshInterval ||
            this.state.autoRefreshEnabled !== prevState.autoRefreshEnabled)
            this.props.autoRefreshChanged(this.state.autoRefreshEnabled, this.state.autoRefreshInterval);

        const mmbOutput = document.getElementById('mmb-output-item');
        if (mmbOutput !== null)
            mmbOutput.scrollTo(0, mmbOutput.scrollHeight);

        forceResize();
    }

    render() {
        const stageOptions = this.props.availableStages.map(n => { return { caption: n.toString(), value: n }} );
        const stageValue = (() => {
            if (this.state.selectedStage)
                return this.state.selectedStage;
            const len = stageOptions.length;
            if (len < 1)
                return undefined;
            return stageOptions[len - 1].value;
        })();

        return (
            <div className='viewer-container'>
                <div id='viewer'></div>
                <div className='viewer-buttons pushbutton-flex-container'>
                    <PushButton
                        className='pushbutton-common pushbutton-flex pushbutton-clr-default pushbutton-hclr-default'
                        value='Ball-and-stick'
                        onClick={() => this.switchRepresentation('ball-and-stick')} />
                    <PushButton
                        className='pushbutton-common pushbutton-flex pushbutton-clr-default pushbutton-hclr-default'
                        value='Cartoon'
                        onClick={() => this.switchRepresentation('cartoon')} />
                    <LinkButton
                        className='pushbutton-common pushbutton-flex pushbutton-clr-default pushbutton-hclr-default'
                        classNameDisabled='pushbutton-common pushbutton-flex pushbutton-clr-default-disabled'
                        value='Download structure'
                        url={this.structureUrl()}
                        downloadAs={`${this.props.structureName}.${this.state.selectedStage ?? 1}.pdb`} />
                </div>
                <div className='viewer-setup'>
                    <StageLField
                        id='mv-stage'
                        label='Show stage'
                        style='left'
                        tooltip='Select which stage of simulation to display'
                        tooltipPosition='above'
                        value={stageValue}
                        options={stageOptions}
                        stringifier={v => v?.toString() ?? ''}
                        updateNotifier={v => this.setState({ ...this.state, selectedStage: v })} />
                    <TimeLField
                        id='mv-refresh-rate'
                        label='Refesh rate (sec):'
                        style='left'
                        tooltip='Query the server for job status automatically every N seconds'
                        tooltipPosition='above'
                        value={this.state.autoRefreshInterval?.toString() ?? ''}
                        validator={v => !isNaN(Num.parseFloatStrict(v)) || v.length === 0}
                        updateNotifier={v => {
                            if (v.length !== 0)
                                this.setState({ ...this.state, autoRefreshInterval: parseFloat(v) });
                        }} />
                    <ChkLField
                        id='mv-toggle-autorefresh'
                        label='Auto:'
                        style='left'
                        tooltip='Enable/disable automatic refresh'
                        tooltipPosition='above'
                        value={this.state.autoRefreshEnabled}
                        updateNotifier={v => this.setState({ ...this.state, autoRefreshEnabled: v })} />
                </div>
                {this.renderMmbOutput()}
            </div>
        );
    }
}

export namespace Viewer {
    export interface AutoRefreshChanged {
        (enabled: boolean, interval: number): void;
    }

    export interface MmbOutput {
        text?: string;
        errors?: string[];
    }

    export type DensityMapFormat = 'ccp4';

    export interface Props {
        densityMap?: { url: string, format: DensityMapFormat };
        structureUrl?: string;
        structureName?: string;
        step: number;
        autoRefreshChanged: AutoRefreshChanged;
        defaultAutoRefreshEnabled: boolean;
        defaultAutoRefreshInterval: number;
        mmbOutput: MmbOutput;
        availableStages: number[];
    }
}