/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { BooleanParameterField, IntegralParameterField, OptionsParameterField, RealParameterField, TextualParameterField } from './advanced-parameter-field';
import { MmbInputUtil as MmbUtil, MMBFU } from './mmb-input-form-util';
import { ErrorBox } from './common/error-box';
import { FormBlock } from './common/form-block';
import { FormContextManager as FCM } from './common/form-context-manager';
import { PushButton } from './common/push-button';
import { ParameterNames, Parameters } from '../mmb/available-parameters';
import { Parameter as P } from '../model/parameter';
import { Num } from '../util/num';

const IntParamField = IntegralParameterField<ParameterNames>();
const RealParamField = RealParameterField<ParameterNames>();
const TextParamField = TextualParameterField<ParameterNames>();
const BoolParamField = BooleanParameterField<ParameterNames>();
const OptsParamField = OptionsParameterField<ParameterNames>();

interface State {
    name: ParameterNames;
    description: string;
}

export class AdvancedMmbOptionsInner extends FormBlock<AdvancedMmbOptionsInner.Props, State> {
    constructor(props: AdvancedMmbOptionsInner.Props) {
        super(props);

        this.state = {
            name: Parameters.keys().next().value,
            description: '',
        };

        this.deleteParameter = this.deleteParameter.bind(this);
        this.updateParameterBool = this.updateParameterBool.bind(this);
        this.updateParameterNum = this.updateParameterNum.bind(this);
        this.updateParameterStr = this.updateParameterStr.bind(this);
    }

    private addParameter(name: ParameterNames) {
        const values = MMBFU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        if (values.has(name))
            return;

        const param = Parameters.get(name)!;
        values.set(name, this.getDefault(param));

        MMBFU.updateValue(this.props.ctxData, { key: 'mol-adv-params', value: values });
    }

    private deleteParameter(name: ParameterNames) {
        const values = MMBFU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        if (values.has(name)) {
            values.delete(name);
            MMBFU.updateValue(this.props.ctxData, { key: 'mol-adv-params', value: values });
        }
    }

    private getDefault(param: P.Parameter<ParameterNames>): any {
        if (P.isReal(param))
            return param.default();
        else if (P.isIntegral(param))
            return param.default();
        else if (P.isBoolean(param))
            return param.default();
        else if (P.isTextual(param))
            return '';
        else if (P.isOptions(param))
            return param.default();

        throw new Error('Invalid parameter type');
    }

    private updateParameterBool(name: ParameterNames, value: boolean) {
        const values = MMBFU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        values.set(name, value);
        MMBFU.updateValue(this.props.ctxData, { key: 'mol-adv-params', value: values });
    }

    private updateParameterNum(name: ParameterNames, value: number) {
        const values = MMBFU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        values.set(name, value);
        MMBFU.updateValue(this.props.ctxData, { key: 'mol-adv-params', value: values });
    }

    private updateParameterStr(name: ParameterNames, value: string) {
        const values = MMBFU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        values.set(name, value);
        MMBFU.updateValue(this.props.ctxData, { key: 'mol-adv-params', value: values });
    }

    private renderParameters() {
        const values = MMBFU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());

        return (
            <div>
                {Array.from(values.entries()).map(e => {
                    const param = Parameters.get(e[0])!;

                    if (P.isIntegral(param)) {
                        return (
                            <IntParamField
                                key={param.name}
                                parameter={param}
                                value={e[1] as number}
                                deleter={this.deleteParameter}
                                updater={this.updateParameterNum} />
                        );
                    } else if (P.isReal(param)) {
                        return (
                            <RealParamField
                                key={param.name}
                                parameter={param}
                                value={e[1]! as number}
                                deleter={this.deleteParameter}
                                updater={this.updateParameterNum} />
                        );
                    } else if (P.isTextual(param)) {
                        return (
                            <TextParamField
                                key={param.name}
                                parameter={param}
                                value={e[1]! as string}
                                deleter={this.deleteParameter}
                                updater={this.updateParameterStr} />
                        );
                    } else if (P.isBoolean(param)) {
                        return (
                            <BoolParamField
                                key={param.name}
                                parameter={param}
                                value={e[1]! as boolean}
                                deleter={this.deleteParameter}
                                updater={this.updateParameterBool} />
                        );
                    } else if (P.isOptions(param)) {
                        return (
                            <OptsParamField
                                key={param.name}
                                parameter={param}
                                value={e[1]! as string}
                                deleter={this.deleteParameter}
                                updater={this.updateParameterStr} />
                        );
                    } else
                        throw new Error('Unknown parameter type');
                })}
            </div>
        );
    }

    componentDidUpdate() {
        const values = MMBFU.getScalar(this.props.ctxData, 'mol-adv-params', new Map<ParameterNames, unknown>());
        const prevErrors = MMBFU.getErrors(this.props.ctxData, 'mol-adv-params');

        const errors = new Array<string>();

        for (const [name, value] of values) {
            const param = Parameters.get(name)!;

            if (P.isReal(param)) {
                const num = Num.parseFloatStrict(value);
                if (!param.isValid(num))
                    errors.push(`${name} is invalid`);
            } else if (P.isIntegral(param)) {
                const num = Num.parseIntStrict(value);
                if (!param.isValid(num))
                    errors.push(`${name} is invalid`);
            } else if (P.isTextual(param)) {
                if (!(param.chkType(value) && param.isValid(value)))
                    errors.push(`${name} is invalid`);
            } else if (P.isBoolean(param)) {
                if (!(param.chkType(value) && param.isValid(value)))
                    errors.push(`${name} is invalid`);
            } else if (P.isOptions(param)) {
                if (!(param.chkType(value) && param.isValid(value)))
                    errors.push(`${name} is invalid`);
            }
        }

        if ((errors.length > 0 && errors.every(e => prevErrors.includes(e))) || (errors.length === 0 && prevErrors.length === 0)) {
            return;
        }

        MMBFU.updateErrors(this.props.ctxData, { key: 'mol-adv-params', errors });
    }

    render() {
        const errors = MMBFU.getErrors(this.props.ctxData, 'mol-adv-params');

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

namespace AdvancedMmbOptionsInner {
    export interface Props extends FormBlock.Props {
        ctxData: MmbUtil.ContextData;
    }
}

export class AdvancedMmbOptions extends FormBlock<AdvancedMmbOptions.Props> {
    render() {
        const CC = FCM.getContext(this.props.formId).Consumer;

        return (
            <CC>
                {(data: MmbUtil.ContextData) =>
                    <AdvancedMmbOptionsInner {...this.props} ctxData={data} />
                }
            </CC>
        );
    }
}

export namespace AdvancedMmbOptions {
    export interface Props extends FormBlock.Props {
    }
}