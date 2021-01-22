/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { CtrldComponent } from './ctrld-component';

export class CheckBox extends CtrldComponent<boolean, CheckBox.Props> {
    render() {
        return (
            <input
                id={this.props.id}
                name={this.props.id}
                type='checkbox'
                checked={this.props.value}
                onChange={e => this.props.updateNotifier(e.currentTarget.checked)}
                disabled={this.props.disabled}
                className={this.props.className ?? 'check-box'} />
        );
    }
}

export namespace CheckBox {
    export interface Props extends CtrldComponent.Props<boolean> {
        className?: string;
        disabled?: boolean;
    }
}