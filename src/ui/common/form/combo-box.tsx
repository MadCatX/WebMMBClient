/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormModel } from '../../../model/common/form';
import { FormField } from './form-field';
import { Util } from '../util';

export class GComboBox<KE, KV extends string, T, U extends FormModel.V<T>> extends FormField<KE, KV, T, GComboBox.Props<KE, KV, T, U>> {
    private getValue() {
        const value = this.props.ctxData.values.get(this.props.keyId);
        return Util.toString(value);
    }

    private updateValue(value: string) {
        const cv = this.props.converter === undefined ? value : this.props.converter(value);
        this.FU.updateValue(this.props.ctxData, { key: this.props.keyId, value: cv});
    }

    render() {
        const value = this.props.forcedValue ?? this.getValue();

        return (
            <select
                id={this.props.id}
                name={this.props.id}
                value={value}
                onChange={
                    (e: React.ChangeEvent<HTMLSelectElement>) => {
                        this.updateValue(e.currentTarget.value);
                    }
                }
                onBlur={
                    (e: React.FocusEvent<HTMLSelectElement>) => {
                        this.updateValue(e.currentTarget.value);
                    }
                }
                className={this.props.className}
            >
                {this.props.options.map((opt) =>
                    (
                        <option
                            key={opt.value}
                            value={opt.value}
                        >{opt.caption}</option>
                    ))
                }
            </select>
        );
    }
}

export namespace GComboBox {
    export type Option = {
        caption: string,
        value: string,
    }

    export interface Props<KE, KV, T, U extends FormModel.V<T>> extends FormField.Props<KE, KV, T> {
        options: Option[];
        converter?: (s: string) => U;
        className?: string;
        selected?: string;
        forcedValue?: string;
    }
}

export function ComboBox<KE, KV extends string, T, U extends FormModel.V<T>>() {
    return GComboBox as new(props: GComboBox.Props<KE, KV, T, U>) => GComboBox<KE, KV, T, U>;
}
