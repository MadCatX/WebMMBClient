/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormField } from './form-field';
import { ComboBox as Model } from '../../../model/common/combo-box';
import { Util } from '../util';

function defStrfr<T>(v?: T) {
    if (v === undefined)
        return '';
    return v as unknown as string;
}

type EArray<T, E> = T extends Array<infer I> ? (Array<I> extends E ? Array<I> : never) : never;
type AType<T, E> = T extends Array<infer I> ? (Array<I> extends E ? I : never) : never;

export class FMultipleComboBox<KE, KV extends string, T, U extends T> extends FormField<KE, KV, T, MultipleComboBox.Props<KE, KV, T, U>> {
    private getValues() {
        const values = this.props.ctxData.values.get(this.props.keyId) as EArray<U, T>;
        if (values === undefined)
            return [];
        return values.map(item => Util.toString(item));
    }

    private updateValues(values: EArray<U, T>) {
        this.FU.updateValue(this.props.ctxData, { key: this.props.keyId, value: values });
    }

    render() {
        return (
            <select
                id={this.props.id}
                name={this.props.id}
                multiple={true}
                size={this.props.rows}
                value={this.getValues()}
                onChange={
                    (e: React.ChangeEvent<HTMLSelectElement>) => {
                        const sel = Array.from(e.currentTarget.selectedOptions);

                        const actualValues = new Array<AType<U, T>>();
                        for (let idx = 0; idx < sel.length; idx++) {
                            const o = sel[idx];
                            const s = this.props.stringifier ? this.props.stringifier(o.value as AType<U, T>) : defStrfr(o.value);

                            // Empty option value denotes "deselect all"
                            if (s === '') {
                                actualValues.length = 0;
                                break;
                            }

                            const ok = this.props.options.find(p => {
                                return p.value === s;
                            });

                            if (ok)
                                actualValues.push(o.value as AType<U, T>);
                        }

                        this.updateValues(actualValues as EArray<U, T>);
                    }
                }
                className={this.props.className ?? 'combo-box combo-box-font multiple-combo-box-icon'}
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

export namespace MultipleComboBox {
    export interface Props<KE, KV, T, U extends T> extends FormField.Props<KE, KV, T> {
        options: Model.Option<AType<U, T>>[];
        rows?: number;
        stringifier?: Model.Stringifier<AType<U, T>>;
        className?: string;
    }

    export function Spec<KE, KV extends string, T, U extends T>() {
        return FMultipleComboBox as new(props: MultipleComboBox.Props<KE, KV, T, U>) => FMultipleComboBox<KE, KV, T, U>;
    }
}

