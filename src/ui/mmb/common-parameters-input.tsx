/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { MmbSetupComponent } from './mmb-setup-component';
import { LabeledField } from '../common/controlled/labeled-field';
import { MdParameters } from '../../model/mmb/md-parameters';
import { Num } from '../../util/num';
import { Eraseable } from '../../util/types';

const ChkBoxLField = LabeledField.CheckBox();
const NumLComboBox = LabeledField.ComboBox<number>();
const StrLField = LabeledField.LineEdit<string>();

interface State {
    baseInteractionScaleFactor: Eraseable<number>;
    reportingInterval: Eraseable<number>;
    numReportingIntervals: Eraseable<number>;
    temperature: Eraseable<number>;
    stage: number;
    useElectrostatics: boolean;
    errors: string[];
}

export class CommonParametersInput extends MmbSetupComponent<CommonParametersInput.Props, State> {
    constructor(props: CommonParametersInput.Props) {
        super(props);

        const global = this.props.setup.global;
        const reporting = this.props.setup.reporting;
        this.state = {
            baseInteractionScaleFactor: Eraseable.Set(global.baseInteractionScaleFactor),
            temperature: Eraseable.Set(global.temperature),
            reportingInterval: Eraseable.Set(reporting.interval),
            numReportingIntervals: Eraseable.Set(reporting.count),
            stage: this.props.setup.stage,
            useElectrostatics: this.props.setup.md.useDefaults,
            errors: [],
        };
    }

    private mergeErrors(newErrors: string[]|undefined) {
        if (newErrors)
            return [...this.state.errors, ...newErrors];
        return [...this.state.errors];
    }

    componentDidMount() {
        this.subscribe(this.props.setup.events.global, g => {
            this.setState({
                ...this.state,
                baseInteractionScaleFactor: Eraseable.Set(g.baseInteractionScaleFactor),
                temperature: Eraseable.Set(g.temperature),
            });
        });
        this.subscribe(this.props.setup.events.md, md => {
            this.setState({
                ...this.state,
                useElectrostatics: md.useDefaults,
            });
        });
        this.subscribe(this.props.setup.events.reporting, rep => {
            this.setState({
                ...this.state,
                reportingInterval: Eraseable.Set(rep.interval),
                numReportingIntervals: Eraseable.Set(rep.count),
            });
        });
        this.subscribe(this.props.setup.events.stage, stage => this.setState({ ...this.state, stage }));
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div className='section'>
                <div className='section-caption'>Common parameters</div>
                <div className='mol-in-gp-input'>
                    <StrLField
                        id='mol-in-bisf'
                        label='Interaction scale factor'
                        style='above'
                        value={this.state.baseInteractionScaleFactor.erased ? '' : this.state.baseInteractionScaleFactor.asStr()}
                        updateNotifier={v => {
                            if (v === '')
                                this.setState({ ...this.state, baseInteractionScaleFactor: Eraseable.Erased() });
                            else {
                                const num = Num.parseFloatStrict(v);
                                if (!isNaN(num)) {
                                    const global = this.props.setup.global;
                                    global.baseInteractionScaleFactor = num;
                                    const errors = this.props.setup.set('global', global);
                                    if (errors) {
                                        this.setState({
                                            ...this.state,
                                            errors: this.mergeErrors(errors),
                                        });
                                    }
                                }
                            }
                        }}
                        tooltip='baseInteractionScaleFactor'
                    />
                    <StrLField
                        id='mol-in-repint'
                        label='Reporting interval'
                        style='above'
                        value={this.state.reportingInterval.erased ? '' : this.state.reportingInterval.asStr()}
                        updateNotifier={v => {
                            if (v === '')
                                this.setState({ ...this.state, reportingInterval: Eraseable.Erased() });
                            else {
                                const num = Num.parseFloatStrict(v);
                                if (!isNaN(num)) {
                                    const reporting = this.props.setup.reporting;
                                    reporting.interval = num;
                                    const errors = this.props.setup.set('reporting', reporting);
                                    if (errors) {
                                        this.setState({
                                            ...this.state,
                                            errors: this.mergeErrors(errors),
                                        });
                                    }
                                }
                            }
                        }}
                        tooltip='reportingInterval'
                    />
                    <StrLField
                        id='mol-in-gp-num-reports'
                        label='Number of reports'
                        style='above'
                        value={this.state.numReportingIntervals.erased ? '' : this.state.numReportingIntervals.asStr()}
                        updateNotifier={v => {
                            if (v === '')
                                this.setState({ ...this.state, numReportingIntervals: Eraseable.Erased() });
                            else {
                                const num = Num.parseIntStrict(v);
                                if (!isNaN(num)) {
                                    const reporting = this.props.setup.reporting;
                                    reporting.count = num;
                                    const errors = this.props.setup.set('reporting', reporting);
                                    if (errors) {
                                        this.setState({
                                            ...this.state,
                                            errors: this.mergeErrors(errors),
                                        });
                                    }
                                }
                            }
                        }}
                        tooltip='numReportingIntervals'
                    />
                    <StrLField
                        id='mol-in-gp-temperature'
                        label='Temperature'
                        style='above'
                        value={this.state.temperature.erased ? '' : this.state.temperature.asStr()}
                        updateNotifier={v => {
                            if (v === '')
                                this.setState({ ...this.state, temperature: Eraseable.Erased() });
                            else {
                                const num = Num.parseFloatStrict(v);
                                if (!isNaN(num)) {
                                    const global = this.props.setup.global;
                                    global.temperature = num;
                                    const errors = this.props.setup.set('global', global);
                                    if (errors) {
                                        this.setState({
                                            ...this.state,
                                            errors: this.mergeErrors(errors),
                                        });
                                    }
                                }
                            }
                        }}
                        tooltip='temperature'
                    />
                    <NumLComboBox
                        id='mol-in-gp-stage'
                        label='Stage'
                        style='above'
                        value={this.state.stage}
                        options={this.props.availableStages.map(n => {
                            return { caption: n.toString(), value: n };
                        })}
                        updateNotifier={stage => {
                            const errors = this.props.setup.set('stage', stage);
                            if (errors) {
                                this.setState({
                                    ...this.state,
                                    errors: this.mergeErrors(errors),
                                });
                            }
                        }}
                        stringifier={v => v?.toString() ?? ''}
                        tooltip='firstStage, lastStage'
                    />
                    <ChkBoxLField
                        id='mol-in-gp-def-md-params'
                        label='Turn on electrostatic and Lennard-Jones forces'
                        style='left'
                        value={this.state.useElectrostatics}
                        updateNotifier={checked => {
                            const errors = this.props.setup.set('md', new MdParameters(checked));
                            if (errors) {
                                this.setState({
                                    ...this.state,
                                    errors: this.mergeErrors(errors),
                                });
                            }
                        }}
                        tooltip='setDefaultMDParameters'
                    />
                </div>
            </div>
        );
    }
}

export namespace CommonParametersInput {
    export interface Props extends MmbSetupComponent.Props {
        availableStages: number[];
    }
}
