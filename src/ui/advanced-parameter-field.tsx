/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { Parameter as P } from '../model/parameter';
import { PushButton } from './common/push-button';
import { Num } from '../util/num';

abstract class AbstractParameterField<K extends (string extends K ? never : string), R extends P.Parameter<K>, T, S = {}> extends React.Component<AbstractParameterField.Props<K, R, T>, S> {
    protected abstract renderInner(): React.ReactFragment;

    render() {
        return (
            <div className='adv-param-field-grid'>
                <div>{this.props.parameter.name}</div>
                {this.renderInner()}
                <PushButton
                    className='pushbutton-common pushbutton-delete'
                    value='-'
                    onClick={e => {
                        e.preventDefault();
                        this.props.deleter(this.props.parameter.name);
                    }} />
            </div>
        );
    }
}

namespace AbstractParameterField {
    export interface Deleter<K extends (string extends K ? never : string)> {
        (name: K): void;
    }

    export interface Updater<K extends (string extends K ? never : string), T> {
        (name: K, value: T): void;
    }

    export interface Props<K extends (string extends K ? never : string), R extends P.Parameter<K>, T> {
        parameter: R;
        deleter: Deleter<K>;
        updater: Updater<K, T>;
        value: T;
    }
}

interface NumInputParameterFieldState {
    value: string;
}

abstract class NumInputParameterField<K extends (string extends K ? never : string), R extends P.Parameter<K>> extends AbstractParameterField<K, R, number, NumInputParameterFieldState> {
    constructor(props: AbstractParameterField.Props<K, R, number>) {
        super(props);

        this.state = {
            value: this.props.value.toString(),
        };
    }

    renderInner() {
        return (
            <input
                type='text'
                value={this.state.value}
                onChange={e => {
                    const value = e.currentTarget.value;
                    const num = Num.parseFloatStrict(value);
                    if (!isNaN(num)) {
                        this.setState({...this.state, value });
                        this.props.updater(this.props.parameter.name, num);
                    }
                }}
                className='line-edit' />
        );
    }
}

export class GIntegralParameterField<K extends (string extends K ? never : string)> extends NumInputParameterField<K, P.IntegralParameter<K>> {
}

export class GRealParameterField<K extends (string extends K ? never : string)> extends NumInputParameterField<K, P.RealParameter<K>> {
}

export class GTextualParameterField<K extends (string extends K ? never : string)> extends AbstractParameterField<K, P.TextualParameter<K>, string> {
    constructor(props: AbstractParameterField.Props<K, P.TextualParameter<K>, string>) {
        super(props);
    }

    renderInner() {
        return (
            <input
                type='text'
                value={this.props.value}
                onChange={e => this.props.updater(this.props.parameter.name, e.currentTarget.value) }
                className='line-edit' />
        );
    }
}

export class GBooleanParameterField<K extends (string extends K ? never : string)> extends AbstractParameterField<K, P.BooleanParameter<K>, boolean> {
    constructor(props: AbstractParameterField.Props<K, P.BooleanParameter<K>, boolean>) {
        super(props);
    }

    renderInner() {
        return (
            <input
                type='checkbox'
                checked={this.props.value}
                onChange={e => { this.props.updater(this.props.parameter.name, e.currentTarget.checked) }}
                className='check-box' />
        );
    }
}

export namespace BooleanParameterField {
    export interface Props<K extends (string extends K ? never : string)> {
        param: P.BooleanParameter<K>;
    }
}

export class GOptionsParameterField<K extends (string extends K ? never : string)> extends AbstractParameterField<K, P.Parameter<K>, string> {
    constructor(props: AbstractParameterField.Props<K, P.Parameter<K>, string>) {
        super(props);
    }

    renderInner() {
        return (
            <select
                onChange={e => this.props.updater(this.props.parameter.name, e.currentTarget.value)}
                onBlur={e => this.props.updater(this.props.parameter.name, e.currentTarget.value)}
                value={this.props.value}
                className='combo-box'
            >
                {this.props.parameter.options()!.map(o => {
                    return (
                        <option
                            key={o}
                            value={o}
                        >
                        {o}
                        </option>)
                })}
            </select>
        );
    }
}

export function IntegralParameterField<K extends (string extends K ? never : string)>() {
    return GIntegralParameterField as new(props: AbstractParameterField.Props<K, P.IntegralParameter<K>, number>) => GIntegralParameterField<K>;
}

export function RealParameterField<K extends (string extends K ? never : string)>() {
    return GRealParameterField as new(props: AbstractParameterField.Props<K, P.RealParameter<K>, number>) => GRealParameterField<K>;
}

export function TextualParameterField<K extends (string extends K ? never : string)>() {
    return GTextualParameterField as new(props: AbstractParameterField.Props<K, P.TextualParameter<K>, string>) => GTextualParameterField<K>;
}

export function BooleanParameterField<K extends (string extends K ? never : string)>() {
    return GBooleanParameterField as new(props: AbstractParameterField.Props<K, P.BooleanParameter<K>, boolean>) => GBooleanParameterField<K>;
}

export function OptionsParameterField<K extends (string extends K ? never : string)>() {
    return GOptionsParameterField as new(props: AbstractParameterField.Props<K, P.Parameter<K>, string>) => GOptionsParameterField<K>;
}
