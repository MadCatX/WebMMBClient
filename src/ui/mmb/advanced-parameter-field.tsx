/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { Parameter as P } from '../../model/mmb/parameter';
import { ErrorBox } from '../common/error-box';
import { PushButton } from '../common/push-button';
import { Num } from '../../util/num';

interface Getter<K extends (string extends K ? never : string), T> {
    (name: K): T|undefined;
}

interface Updater<K extends (string extends K ? never : string), T> {
    (name: K, value: T): string[]|undefined;
}

interface NumericArgumentState {
    valueAsText: string;
    errors: string[];
}
type NumericArgumentProps<K extends (string extends K ? never : string)> = Argument.Props<K, P.IntegralArgument|P.RealArgument, number>

class NumericArgument<K extends (string extends K ? never : string)> extends React.Component<NumericArgumentProps<K>, NumericArgumentState> {
    constructor(props: NumericArgumentProps<K>) {
        super(props);
        this.state = {
            valueAsText: this.props.getter(this.props.name)?.toString() ?? '',
            errors: [],
        };
    }

    render() {
        return (
            <div>
                <input
                    type='text'
                    value={this.state.valueAsText}
                    onChange={e => {
                        const value = e.currentTarget.value;
                        const num = Num.parseFloatStrict(value);
                        if (value === '')
                            this.setState({ ...this.state, valueAsText: e.currentTarget.value, errors: ['Value cannot be empty'] });
                        else if (!isNaN(num)) {
                            this.props.argument.isValid(num);
                            const errors = this.props.updater(this.props.name, num);
                            if (!errors)
                                this.setState({ ...this.state, valueAsText: e.currentTarget.value, errors: [] });
                            else {
                                /* This doesn't prevent the user from entering nonsensical input but trying to sanitize
                                 * user input on the fly is far too restrictive and makes the user interface inconvenient
                                 */
                                this.setState({ ...this.state, valueAsText: e.currentTarget.value, errors: ['Value is invalid'] });
                            }
                        } else
                            this.setState({ ...this.state, valueAsText: e.currentTarget.value, errors: ['Value is invalid'] });
                    }}
                    className='line-edit'
                />
                <ErrorBox errors={this.state.errors} />
            </div>
        );
    }
}

class BooleanArgument<K extends (string extends K ? never : string)> extends React.Component<Argument.Props<K, P.BooleanArgument, boolean>> {
    render() {
        return (
            <input
                type='checkbox'
                checked={this.props.getter(this.props.name) ?? false}
                onChange={e => this.props.updater(this.props.name, e.currentTarget.checked)}
                className='check-box'
            />
        );
    }
}

interface TextualArgumentState {
    value: string;
    errors: string[];
}
type TextualArgumentProps<K extends (string extends K ? never : string)> = Argument.Props<K, P.TextualArgument, string>

class TextualArgument<K extends (string extends K ? never : string)> extends React.Component<TextualArgumentProps<K>, TextualArgumentState> {
    constructor(props: TextualArgumentProps<K>) {
        super(props);

        this.state = {
            value: this.props.getter(this.props.name) ?? '',
            errors: [],
        };
    }

    render() {
        return (
            <input
                type='text'
                value={this.state.value}
                onChange={e => {
                    const v = e.currentTarget.value;
                    if (this.props.argument.isValid(v)) {
                        const errors = this.props.updater(this.props.name, v);
                        /* This looks like a double error check but let's take care of a case where the model uses a different check than the widget
                         * This situation should not happen and indicates a mismatch in the validation functions */
                        if (errors)
                            this.setState({ ...this.state, value: v, errors: ['Model reports value as invalid'] });
                        else
                            this.setState({ ...this.state, value: v, errors: [] });
                    } else
                        this.setState({ ...this.state, value: v, errors: ['Value is invalid'] });
                }}
                className='line-edit'
            />
        );
    }
}

class OptionsArgument<K extends (string extends K ? never : string)> extends React.Component<Argument.Props<K, P.OptionsArgument<string>, string>> {
    private update(v: string) {
        if (this.props.argument.isValid(v))
            this.props.updater(this.props.name, v);
    }

    render() {
        return (
            <select
                value={this.props.getter(this.props.name)}
                onChange={e => this.update(e.currentTarget.value)}
                onBlur={e => this.update(e.currentTarget.value)}
                className='combo-box'
            >
                {this.props.argument.options()!.map(o => {
                    return (
                        <option
                            key={o}
                            value={o}
                        >
                            {o}
                        </option>
                    );
                })}
            </select>
        );
    }
}

namespace Argument {
    export interface Props<K extends (string extends K ? never : string), A, T> {
        name: K;
        argument: A;
        getter: Getter<K, T>;
        updater: Updater<K, T>;
    }
}

class GNumericAdvancedParameter<K extends (string extends K ? never : string)> extends React.Component<AdvancedParameter.Props<K, number, P.Range>> {
    private getArgument(): P.IntegralArgument|P.RealArgument {
        const p = this.props.parameter;
        if (P.isStatic(p)) {
            const arg = p.getArgument();
            if (P.isIntegralArg(arg) || P.isRealArg(arg))
                return arg;
        } else if (P.isDynamicIntegral(p) || P.isDynamicReal(p))
            return p.getArgument(this.props.dynVals);
        throw new Error('Invalid argument type');
    }

    render() {
        return (
            <div className='adv-param-field-grid'>
                <div>{this.props.parameter.name}</div>
                <NumericArgument
                    name={this.props.parameter.name}
                    getter={this.props.getter}
                    updater={this.props.updater}
                    argument={this.getArgument()}
                />
                <PushButton
                    className='pushbutton-common pushbutton-delete'
                    value='-'
                    onClick={() => {
                        this.props.deleter(this.props.parameter.name);
                    }}
                />
            </div>
        );
    }
}

class GBooleanAdvancedParameter<K extends (string extends K ? never : string)> extends React.Component<AdvancedParameter.Props<K, boolean, void>> {
    private getArgument() {
        const p = this.props.parameter;
        if (P.isStatic(p)) {
            const arg = p.getArgument();
            if (P.isBooleanArg(arg))
                return arg;
        } else if (P.isDynamicBoolean(p))
            return p.getArgument();
        throw new Error('Invalid argument type');
    }

    render() {
        return (
            <div className='adv-param-field-grid'>
                <div>{this.props.parameter.name}</div>
                <BooleanArgument
                    name={this.props.parameter.name}
                    getter={this.props.getter}
                    updater={this.props.updater}
                    argument={this.getArgument()}
                />
                <PushButton
                    className='pushbutton-common pushbutton-delete'
                    value='-'
                    onClick={() => {
                        this.props.deleter(this.props.parameter.name);
                    }}
                />
            </div>
        );
    }
}

class GTextualAdvancedParameter<K extends (string extends K ? never : string)> extends React.Component<AdvancedParameter.Props<K, string, P.TextualValidator>> {
    private getArgument() {
        const p = this.props.parameter;
        if (P.isStatic(p)) {
            const arg = p.getArgument();
            if (P.isTextualArg(arg))
                return arg;
        } else if (P.isDynamicTextual(p))
            return p.getArgument(this.props.dynVals);
        throw new Error('Invalid argument type');
    }

    render() {
        return (
            <div className='adv-param-field-grid'>
                <div>{this.props.parameter.name}</div>
                <TextualArgument
                    name={this.props.parameter.name}
                    getter={this.props.getter}
                    updater={this.props.updater}
                    argument={this.getArgument()}
                />
                <PushButton
                    className='pushbutton-common pushbutton-delete'
                    value='-'
                    onClick={() => {
                        this.props.deleter(this.props.parameter.name);
                    }}
                />
            </div>
        );
    }
}

class GOptionsAdvancedParameter<K extends (string extends K ? never : string)> extends React.Component<AdvancedParameter.Props<K, string, string[]>> {
    private getArgument() {
        const p = this.props.parameter;
        if (P.isStatic(p)) {
            const arg = p.getArgument();
            if (P.isOptionsArg(arg))
                return arg;
        } else if (P.isDynamicOptions(p))
            return p.getArgument(this.props.dynVals);
        throw new Error('Invalid argument type');
    }

    render() {
        return (
            <div className='adv-param-field-grid'>
                <div>{this.props.parameter.name}</div>
                <OptionsArgument
                    name={this.props.parameter.name}
                    getter={this.props.getter}
                    updater={this.props.updater}
                    argument={this.getArgument()}
                />
                <PushButton
                    className='pushbutton-common pushbutton-delete'
                    value='-'
                    onClick={() => {
                        this.props.deleter(this.props.parameter.name);
                    }} />
            </div>
        );
    }
}

export namespace AdvancedParameter {
    export interface Deleter<K extends (string extends K ? never : string)> {
        (name: K): void;
    }

    export interface Updater<K extends (string extends K ? never : string), T> {
        (name: K, value: T): string[]|undefined;
    }

    export interface Props<K extends (string extends K ? never : string), T, E> {
        parameter: P.Parameter<K>;
        getter: Getter<K, T>;
        updater: Updater<K, T>;
        deleter: Deleter<K>;
        dynVals: E|undefined;
    }
}

export function NumericAdvancedParameter<K extends (string extends K ? never : string)>() {
    return GNumericAdvancedParameter as new(props: AdvancedParameter.Props<K, number, P.Range>) => GNumericAdvancedParameter<K>;
}

export function BooleanAdvancedParameter<K extends (string extends K ? never : string)>() {
    return GBooleanAdvancedParameter as new(props: AdvancedParameter.Props<K, boolean, void>) => GBooleanAdvancedParameter<K>;
}

export function TextualAdvancedParameter<K extends (string extends K ? never : string)>() {
    return GTextualAdvancedParameter as new(props: AdvancedParameter.Props<K, string, P.TextualValidator>) => GTextualAdvancedParameter<K>;
}

export function OptionsAdvancedParameter<K extends (string extends K ? never : string)>() {
    return GOptionsAdvancedParameter as new(props: AdvancedParameter.Props<K, string, string[]>) => GOptionsAdvancedParameter<K>;
}
