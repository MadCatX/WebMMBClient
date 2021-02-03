/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormField } from './form-field';

export class FTextArea<KE, KV extends string, T> extends FormField<KE, KV, T, TextArea.Props<KE, KV, T>> {
    private getValue() {
        return this.props.ctxData.values.get(this.props.keyId) as string ?? '';
    }

    private setValue(v: string) {
        const nv = this.FU.emptyValues();
        nv.set(this.props.keyId, v);
        this.props.ctxData.setValues(nv);
    }

    render() {
        let cls = this.props.className ?? 'text-area';
        if (this.props.resizeMode) {
            switch (this.props.resizeMode) {
            case 'horizontal':
                cls += ' text-area-horiz-resize';
                break;
            case 'vertical':
                cls += ' text-area-vert-resize';
                break;
            case 'none':
                cls += ' text-area-no-resize';
                    break;
            }
        }

        return (
            <textarea
                id={this.props.id}
                name={this.props.id}
                onChange={
                    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        let v = e.currentTarget.value;
                        v = this.props.modifier ? this.props.modifier(v) : v;

                        if (this.props.validator) {
                            if (this.props.validator(v))
                                this.setValue(v);
                        } else
                            this.setValue(v);
                    }
                }
                placeholder={this.props.hint}
                readOnly={this.props.readonly}
                spellCheck={this.props.spellcheck}
                disabled={this.props.disabled}
                rows={this.props.rows}
                cols={this.props.columns}
                value={this.getValue()}
                className={cls} />
        );
    }
}

export namespace TextArea {
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
        resizeMode?: 'free' | 'horizontal' | 'vertical' | 'none';
        validator?: Validator;
        modifier?: Modifier;
        className?: string;
    }

    export function Spec<KE, KV extends string, T>() {
        return FTextArea as new(props: TextArea.Props<KE, KV, T>) => FTextArea<KE, KV, T>;
    }
}
