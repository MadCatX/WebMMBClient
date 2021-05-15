/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as AP from './advanced-parameter-field';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { FormUtil } from '../model/common/form';
import { ErrorBox } from './common/error-box';
import { PushButton } from './common/push-button';
import { FormBlock } from './common/form/form-block';
import { ParameterNames, Parameters } from '../mmb/available-parameters';
import { Parameter as P } from '../model/parameter';
import { Num } from '../util/num';
import {AdditionalFile} from '../model/additional-file';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();

const NumAdvParam = AP.NumericAdvancedParameter<ParameterNames>();
const BoolAdvParam = AP.BooleanAdvancedParameter<ParameterNames>();
const TextAdvParam = AP.TextualAdvancedParameter<ParameterNames>();
const OptsAdvParam = AP.OptionsAdvancedParameter<ParameterNames>();

interface State {
    name: ParameterNames;
    description: string;
}

export class AdvancedMmbOptions extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, AdvancedMmbOptions.Props, State> {
    constructor(props: AdvancedMmbOptions.Props) {
        super(props);

        this.state = {
            name: Parameters.keys().next().value,
            description: '',
        };

        this.deleteParameter = this.deleteParameter.bind(this);
    }

    private addParameter(name: ParameterNames) {
        const values = FU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        if (values.has(name))
            return;

        const param = Parameters.get(name)!;
        values.set(name, this.getDefault(param));

        FU.updateValue(this.props.ctxData, { key: 'mol-adv-params', value: values });
    }

    private deleteParameter(name: ParameterNames) {
        const values = FU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        if (values.has(name)) {
            values.delete(name);
            FU.updateValue(this.props.ctxData, { key: 'mol-adv-params', value: values });
        }
    }

    private dynValsFor(param: P.Parameter<ParameterNames>): any|undefined {
        const name = param.name;

        if (name === 'densityFileName' ||
            name === 'electroDensityFileName' ||
            name === 'inQVectorFileName' ||
            name === 'leontisWesthofInFileName' ||
            name === 'tinkerParameterFileName') {
            const files = FU.getArray<AdditionalFile[]>(this.props.ctxData, 'mol-in-additional-files-added');
            return files.map(f => f.name);
        } else
            return undefined;
    }

    private getArgument(param: P.Parameter<ParameterNames>) {
        if (P.isStatic(param)) {
            const arg = param.getArgument();
            if (P.isIntegralArg(arg) ||
                P.isRealArg(arg) ||
                P.isBooleanArg(arg) ||
                P.isTextualArg(arg) ||
                P.isOptionsArg(arg))
                return arg;
        } else if (P.isDynamicIntegral(param) ||
                   P.isDynamicReal(param)) {
            const dynVals = this.dynValsFor(param);
            return param.getArgument(dynVals);
        } else if (P.isDynamicBoolean(param)) {
            return param.getArgument();
        } else if (P.isDynamicTextual(param)) {
            const dynVals = this.dynValsFor(param);
            return param.getArgument(dynVals);
        } else if (P.isDynamicOptions(param)) {
            const dynVals = this.dynValsFor(param);
            return param.getArgument(dynVals);
        }

        throw new Error('Invalid parameter type');
    }

    private getDefault(param: P.Parameter<ParameterNames>) {
        return this.getArgument(param).default();
    }

    private getValue<T>(name: ParameterNames): T|undefined {
        const values = FU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());
        return values.get(name) as T;
    }

    private updateValue<T>(name: ParameterNames, value: T) {
        const values = FU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        values.set(name, value);
        FU.updateValue(this.props.ctxData, { key: 'mol-adv-params', value: values });
    }

    private renderParameters() {
        const values = FU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        return (
            <div>
                {Array.from(values.entries()).map(([k, _v]) => {
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
                                    dynVals={this.dynValsFor(param)}
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
                                    dynVals={this.dynValsFor(param)}
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
                                    dynVals={this.dynValsFor(param)}
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
                                    dynVals={this.dynValsFor(param)}
                                    key={param.name}
                                />
                            );
                    }
                })}
            </div>
        );
    }

    componentDidUpdate() {
        const values = FU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());
        const prevErrors = FU.getErrors(this.props.ctxData, 'mol-adv-params');

        const errors = new Array<string>();

        for (const [name, value] of values) {
            const param = Parameters.get(name)!;
            const arg = this.getArgument(param);

            if (P.isIntegralArg(arg)) {
                const num = Num.parseIntStrict(value);
                if (!arg.isValid(num))
                    errors.push(`${name} is invalid`);
            } else if (P.isRealArg(arg)) {
                const num = Num.parseFloatStrict(value);
                if (!arg.isValid(num))
                    errors.push(`${name} is invalid`);
            } else if (P.isTextualArg(arg)) {
                if (!(arg.chkType(value) && arg.isValid(value)))
                    errors.push(`${name} is invalid`);
            } else if (P.isBooleanArg(arg)) {
                if (!(arg.chkType(value) && arg.isValid(value)))
                    errors.push(`${name} is invalid`);
            } else if (P.isOptionsArg(arg)) {
                if (!(arg.chkType(value) && arg.isValid(value))) {
                    const def = this.getDefault(param);
                    if (def !== undefined)
                        this.updateValue(param.name, def);
                    else
                        errors.push(`${name} is invalid`);
                }
            }
        }

        if ((errors.length > 0 && errors.every(e => prevErrors.includes(e))) || (errors.length === 0 && prevErrors.length === 0)) {
            return;
        }

        FU.updateErrors(this.props.ctxData, { key: 'mol-adv-params', errors });
    }

    render() {
        const errors = FU.getErrors(this.props.ctxData, 'mol-adv-params');

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
                            description: Parameters.get(e.currentTarget.value as ParameterNames)!.description
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
                <ErrorBox
                    errors={errors} />
            </div>
        );
    }
}

export namespace AdvancedMmbOptions {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}
