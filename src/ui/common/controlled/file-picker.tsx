/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { CtrldComponent } from './ctrld-component';

export class FilePicker extends CtrldComponent<File, FilePicker.Props> {
    render() {
        return (
            <div className='file-picker'>
                <input
                    id={this.props.id}
                    name={this.props.id}
                    type='file'
                    onChange={
                        (e: React.ChangeEvent<HTMLInputElement>) => {
                            let v = e.currentTarget.files
                            if (v === null || v[0] === null)
                                return;

                            this.props.updateNotifier(v[0]);
                        }

                    }
                    disabled={this.props.disabled}
                    className={this.props.className ?? 'file-upload'} />
            </div>
        );
    }
}

export namespace FilePicker {
    export interface Props extends CtrldComponent.Props<File> {
        hint?: string;
        className?: string;
        disabled?: boolean;
    }
}
