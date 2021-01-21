/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { CtrldComponent } from './ctrld-component';

export class TextArea<T extends string> extends CtrldComponent<T, TextArea.Props<T>> {
    render() {
        return (
            <textarea
                id={this.props.id}
                name={this.props.id}
                value={this.props.value}
                onChange={
                    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        let v = e.currentTarget.value;
                        v = this.props.modifier ? this.props.modifier(v) : v;

                        if (this.props.validator) {
                            if (this.props.validator(v))
                                this.props.updateNotifier(v as T);
                        } else
                            this.props.updateNotifier(v as T);
                    }
                }
                placeholder={this.props.hint}
                readOnly={this.props.readonly}
                spellCheck={this.props.spellcheck}
                disabled={this.props.disabled}
                rows={this.props.rows}
                cols={this.props.columns}
                className={this.props.className ?? 'text-area'} />
        );
    }
}

export namespace TextArea {
    export interface Props<T> extends CtrldComponent.Props<T> {
        hint?: string;
        rows?: number;
        columns?: number;
        readonly?: boolean;
        spellcheck?: boolean;
        disabled?: boolean;
        className?: string;
    }

    export function Spec<T extends string>() {
        return TextArea as new(props: Props<T>) => TextArea<T>;
    }
}
