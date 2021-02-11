/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ComboBox as Model } from '../../../model/common/combo-box';
import { CtrldComponent } from './ctrld-component';

function defStrfr<T>(v?: T) {
    if (v === undefined)
        return '';
    return v as unknown as string;
}

export class ComboBox<T> extends CtrldComponent<T, ComboBox.Props<T>> {
    render() {
        const v = this.props.stringifier ? this.props.stringifier(this.props.value) : defStrfr(this.props.value);
        return (
            <select
                id={this.props.id}
                name={this.props.id}
                value={v}
                onChange={
                    (e: React.ChangeEvent<HTMLSelectElement>) => {
                        const v = e.currentTarget.value;
                        const actualValue = this.props.options.find(o => {
                            const s = this.props.stringifier ? this.props.stringifier(o.value) : defStrfr(o.value);
                            return v === s;
                        });

                        if (actualValue !== undefined)
                            this.props.updateNotifier(actualValue.value);
                    }
                }
                disabled={this.props.disabled}
                className={this.props.className ?? 'combo-box combo-box-font combo-box-icon'}
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

export namespace ComboBox {
    export interface Props<T> extends CtrldComponent.Props<T> {
        options: Model.Option<T>[];
        stringifier?: Model.Stringifier<T>;
        disabled?: boolean;
        className?: string;
    }

    export function Spec<T>() {
        return ComboBox as new(props: Props<T>) => ComboBox<T>;
    }
}

