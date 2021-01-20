/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormField } from './form-field';
import { UiUtil } from './util';

export class GLineEdit<KE, KV extends string, T> extends FormField<KE, KV, T, GLineEdit.Props<KE, KV, T>> {
    private getValue() {
        const value = this.props.ctxData.values.get(this.props.keyId)!;
        return UiUtil.toString(value);
    }

    private setValue(v: string) {
        if (v === '') {
            this.props.ctxData.clearValues([this.props.keyId]);
            return;
        }

        if (this.props.validator !== undefined) {
            if (this.props.validator(v) === false)
                return;
        }

        const nv = this.FU.emptyValues();
        nv.set(this.props.keyId, v);
        this.props.ctxData.setValues(nv);
    }

    render() {
        return (
            <input
                name={this.props.id}
                type='text'
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    if (this.props.modifier)
                        this.setValue(this.props.modifier(e.currentTarget.value));
                }}
                onChange={
                    (e: React.ChangeEvent<HTMLInputElement>) => this.setValue(e.currentTarget.value)
                }
                value={this.getValue()}
                placeholder={this.props.hint}
                disabled={this.props.disabled}
                className={this.props.className} />
        );
    }
}

export namespace GLineEdit {
    export interface Modifier {
        (v: string): string;
    }

    export interface Validator {
        (v: string): boolean;
    }

    export interface Props<KE, KV, T> extends FormField.Props<KE, KV, T> {
        hint?: string,
        modifier?: Modifier,
        validator?: Validator,
        className?: string,
        disabled?: boolean,
    }
}

export function LineEdit<KE, KV extends string, T>() {
    return GLineEdit as new(props: GLineEdit.Props<KE, KV, T>) => GLineEdit<KE, KV, T>;
}
