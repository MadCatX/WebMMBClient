/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormField } from './form-field';

export class GCheckBox<KE, KV, T> extends FormField<KE, KV, T, GCheckBox.Props<KE, KV, T>> {
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
                className={this.props.className ?? 'checkbox'}
                type='checkbox'
                id={this.props.id}
                name={this.props.id}
                checked={checked}
                onChange={e => this.updateValue(e.currentTarget.checked)} />
        );
    }
}

export namespace GCheckBox {
    export interface Props<KE, KV, T> extends FormField.Props<KE, KV, T> {
        className?: string,
    }
}

export function CheckBox<KE, KV, T>() {
    return GCheckBox as new(props: GCheckBox.Props<KE, KV, T>) => GCheckBox<KE, KV, T>;
}