/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { CtrldComponent } from './ctrld-component';

export class LineEdit<T extends string> extends CtrldComponent<T, LineEdit.Props<T>> {
    render() {
        return (
            <input
                id={this.props.id}
                name={this.props.id}
                type='text'
                value={this.props.value}
                onChange={
                    (e: React.ChangeEvent<HTMLInputElement>) => {
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
                disabled={this.props.disabled}
                className={this.props.className ?? 'line-edit'} />
        );
    }
}

export namespace LineEdit {
    export interface Props<T> extends CtrldComponent.Props<T> {
        hint?: string;
        className?: string;
        disabled?: boolean;
    }

    export function Spec<T extends string>() {
        return LineEdit as new(props: Props<T>) => LineEdit<T>;
    }
}

