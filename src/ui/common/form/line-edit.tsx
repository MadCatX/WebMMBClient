/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormField } from './form-field';

export class FLineEdit<KE, KV extends string, T> extends FormField<KE, KV, T, LineEdit.Props<KE, KV, T>> {
    private getValue() {
        return this.props.ctxData.values.get(this.props.keyId) as string ?? '';
    }

    private setValue(v: string) {
        const nv = this.FU.emptyValues();
        nv.set(this.props.keyId, v);
        this.props.ctxData.setValues(nv);
    }

    render() {
        return (
            <input
                name={this.props.id}
                type='text'
                value={this.getValue()}
                onChange={
                    (e: React.ChangeEvent<HTMLInputElement>) => {
                        let v = e.currentTarget.value;
                        v = this.props.modifier ? this.props.modifier(v) : v;

                        if (this.props.validator) {
                            if (this.props.validator(v))
                                this.setValue(v)
                        } else
                            this.setValue(v);
                    }
                }
                placeholder={this.props.hint}
                disabled={this.props.disabled}
                className={this.props.className ?? 'line-edit'} />
        );
    }
}

export namespace LineEdit {
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

    export function Spec<KE, KV extends string, T>() {
        return FLineEdit as new(props: LineEdit.Props<KE, KV, T>) => FLineEdit<KE, KV, T>;
    }
}
