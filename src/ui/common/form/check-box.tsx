/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormField } from './form-field';

export class FCheckBox<KE, KV extends string, T> extends FormField<KE, KV, T, CheckBox.Props<KE, KV, T>> {
    private isChecked() {
        return (this.props.ctxData.values.get(this.props.keyId) ?? false) as boolean;
    }

    private updateValue(value: boolean) {
        this.FU.updateValue(this.props.ctxData, { key: this.props.keyId, value});
    }

    render() {
        const checked = this.isChecked();

        return (
            <input
                className={this.props.className ?? 'check-box'}
                type='checkbox'
                id={this.props.id}
                name={this.props.id}
                checked={checked}
                onChange={e => this.updateValue(e.currentTarget.checked)} />
        );
    }
}

export namespace CheckBox {
    export interface Props<KE, KV extends string, T> extends FormField.Props<KE, KV, T> {
        className?: string,
    }

    export function Spec<KE, KV extends string, T>() {
        return FCheckBox as new(props: CheckBox.Props<KE, KV, T>) => FCheckBox<KE, KV, T>;
    }
}