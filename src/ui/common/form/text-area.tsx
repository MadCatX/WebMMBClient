/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormField } from './form-field';

export class GTextArea<KE, KV extends string, T> extends FormField<KE, KV, T, GTextArea.Props<KE, KV, T>> {
    private getValue() {
        const value = this.props.ctxData.values.get(this.props.keyId);
        if (typeof value !== 'string')
            return '';
        return value;
    }

    render() {
        return (
            <textarea
                id={this.props.id as unknown as string}
                name={this.props.id as unknown as string}
                onChange={
                    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        const v = (this.props.modifier !== undefined) ? this.props.modifier(e.currentTarget.value) : e.currentTarget.value;

                        if (v === '') {
                            this.props.ctxData.clearValues([this.props.keyId]);
                            return;
                        }

                        if (this.props.validator !== undefined) {
                            if (!this.props.validator(v))
                                return;
                        }

                        const nv = this.FU.emptyValues();
                        nv.set(this.props.keyId, v);
                        this.props.ctxData.setValues(nv);
                    }
                }
                placeholder={this.props.hint}
                readOnly={this.props.readonly}
                spellCheck={this.props.spellcheck}
                disabled={this.props.disabled}
                rows={this.props.rows}
                cols={this.props.columns}
                value={this.getValue()}
                className={this.props.className} />
        );
    }
}

export namespace GTextArea {
    export interface Modifier {
        (s: string): string;
    }

    export interface Validator {
        (s: string): boolean;
    }

    export interface Props<KE, KV, T> extends FormField.Props<KE, KV, T> {
        hint?: string;
        rows?: number;
        columns?: number;
        readonly?: boolean;
        spellcheck?: boolean;
        disabled?: boolean;
        validator?: Validator;
        modifier?: Modifier;
        className?: string;
    }
}

export function TextArea<KE, KV extends string, T>() {
    return GTextArea as new(props: GTextArea.Props<KE, KV, T>) => GTextArea<KE, KV, T>;
}
