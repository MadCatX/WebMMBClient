/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as AP from './advanced-parameter-field';
import { MmbSetupComponent } from './mmb-setup-component';
import { ErrorBox } from '../common/error-box';
import { PushButton } from '../common/push-button';
import { ParameterNames, Parameters } from '../../mmb/available-parameters';
import { AdvancedParameters } from '../../model/mmb/advanced-parameters';
import { Parameter as P } from '../../model/mmb/parameter';

const NumAdvParam = AP.NumericAdvancedParameter<ParameterNames>();
const BoolAdvParam = AP.BooleanAdvancedParameter<ParameterNames>();
const TextAdvParam = AP.TextualAdvancedParameter<ParameterNames>();
const OptsAdvParam = AP.OptionsAdvancedParameter<ParameterNames>();

interface State {
    name: ParameterNames;
    description: string;
    errors: string[];
}

export class AdvancedMmbParameters extends MmbSetupComponent<AdvancedMmbParameters.Props, State> {
    constructor(props: AdvancedMmbParameters.Props) {
        super(props);

        this.state = {
            name: Parameters.keys().next().value,
            description: '',
            errors: [],
        };

        this.deleteParameter = this.deleteParameter.bind(this);
    }

    private addParameter(name: ParameterNames) {
        const advParams = this.props.setup.advancedParameters;
        if (advParams.has(name))
            return;

        const param = Parameters.get(name)!;
        advParams.set(name, AdvancedParameters.getArgument(param, this.props.setup).default());

        this.props.setup.set('advancedParameters', advParams);
    }

    private deleteParameter(name: ParameterNames) {
        const advParams = this.props.setup.advancedParameters;

        if (advParams.has(name)) {
            advParams.delete(name);
            this.props.setup.set('advancedParameters', advParams);
        }
    }

    private dynValsFor(param: P.Parameter<ParameterNames>): P.DynValTypes {
        return AdvancedParameters.getDynValsFor(param, { additionalFiles: this.props.setup.additionalFiles });
    }

    private getValue<T>(name: ParameterNames): T|undefined {
        const advParams = this.props.setup.advancedParameters;
        return advParams.get(name) as T|undefined;
    }

    private updateValue<T extends P.ArgTypes>(name: ParameterNames, value: T) {
        const advParams = this.props.setup.advancedParameters;
        advParams.set(name, value);
        return this.props.setup.set('advancedParameters', advParams);
    }

    private renderParameters() {
        const advParams = this.props.setup.advancedParameters;

        return (
            <div>
                {Array.from(advParams.entries()).map(([k, _v]) => {
                    const param = Parameters.get(k)!;

                    const type = param.getType();
                    switch (type) {
                    case 'integral':
                    case 'real':
                        return (
                            <NumAdvParam
                                parameter={param}
                                deleter={name => this.deleteParameter(name)}
                                getter={name => this.getValue(name)}
                                updater={(name: ParameterNames, value: number|undefined) => this.updateValue(name, value)}
                                dynVals={this.dynValsFor(param) as P.Range}
                                key={param.name}
                            />
                        );
                    case 'boolean':
                        return (
                            <BoolAdvParam
                                parameter={param}
                                deleter={name => this.deleteParameter(name)}
                                getter={name => this.getValue(name)}
                                updater={(name: ParameterNames, value: boolean) => this.updateValue(name, value)}
                                dynVals={this.dynValsFor(param) as void}
                                key={param.name}
                            />
                        );
                    case 'textual':
                        return (
                            <TextAdvParam
                                parameter={param}
                                deleter={name => this.deleteParameter(name)}
                                getter={name => this.getValue(name)}
                                updater={(name: ParameterNames, value: string) => this.updateValue(name, value)}
                                dynVals={this.dynValsFor(param) as P.TextualValidator}
                                key={param.name}
                            />
                        );
                    case 'options':
                        return (
                            <OptsAdvParam
                                parameter={param}
                                deleter={name => this.deleteParameter(name)}
                                getter={name => this.getValue(name)}
                                updater={(name: ParameterNames, value: string) => this.updateValue(name, value)}
                                dynVals={this.dynValsFor(param) as string[]}
                                key={param.name}
                            />
                        );
                    }
                })}
            </div>
        );
    }

    componentDidMount() {
        this.subscribe(this.props.setup.events.advancedParameters, () => this.forceUpdate());
        this.subscribe(this.props.setup.events.additionalFiles, () => this.forceUpdate());
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div className='section'>
                <div className='section-caption'>Advanced MMB parameters</div>
                <div className='mol-in-adv-params spaced-grid'>
                    <div>Parameter</div>
                    <div>Description</div>
                    <div></div>
                    <select
                        onChange={e => this.setState({
                            ...this.state,
                            name: e.currentTarget.value as ParameterNames,
                            description: Parameters.get(e.currentTarget.value as ParameterNames)!.description,
                        })}
                        className='combo-box'
                    >
                        {Array.from(Parameters.values()).sort().map(o => (<option key={o.name} value={o.name}>{o.name}</option>))}
                    </select>
                    <div>{this.state.description}</div>
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addParameter(this.state.name);
                        }} />
                </div>
                {this.renderParameters()}
                <ErrorBox errors={this.state.errors} />
            </div>
        );
    }
}

export namespace AdvancedMmbParameters {
    export interface Props extends MmbSetupComponent.Props {
    }
}
