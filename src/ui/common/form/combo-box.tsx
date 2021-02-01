/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormModel } from '../../../model/common/form';
import { FormField } from './form-field';
import { ComboBox as Model } from '../../../model/common/combo-box';
import { Util } from '../util';

function defStrfr<T>(v?: T) {
    if (v === undefined)
        return '';
    return v as unknown as string;
}

export class FComboBox<KE, KV extends string, T, U extends FormModel.V<T>> extends FormField<KE, KV, T, ComboBox.Props<KE, KV, T, U>> {
    private getValue() {
        const value = this.props.ctxData.values.get(this.props.keyId);
        return Util.toString(value);
    }

    private updateValue(value: U) {
        this.FU.updateValue(this.props.ctxData, { key: this.props.keyId, value });
    }

    render() {
        return (
            <select
                id={this.props.id}
                name={this.props.id}
                value={this.getValue()}
                onChange={
                    (e: React.ChangeEvent<HTMLSelectElement>) => {
                        const v = e.currentTarget.value;
                        const actualValue = this.props.options.find(o => {
                            const s = this.props.stringifier ? this.props.stringifier(o.value) : defStrfr(o.value);
                            return v === s;
                        });

                        if (actualValue !== undefined)
                            this.updateValue(actualValue.value);
                    }
                }
                className={this.props.className ?? 'combo-box combo-box-font combo-box-icon'}
            >
                {this.props.options.map(o => {
                    const v = this.props.stringifier ? this.props.stringifier(o.value) : defStrfr(o.value);
                    return (
                        <option
                            key={v}
                            value={v}
                        >{o.caption}</option>
                    );
                })}
            </select>
        );
    }
}

export namespace ComboBox {
    export interface Props<KE, KV, T, U extends FormModel.V<T>> extends FormField.Props<KE, KV, T> {
        options: Model.Option<U>[];
        stringifier?: Model.Stringifier<U>;
        className?: string;
    }

    export function Spec<KE, KV extends string, T, U extends FormModel.V<T>>() {
        return FComboBox as new(props: ComboBox.Props<KE, KV, T, U>) => FComboBox<KE, KV, T, U>;
    }
}

