/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { CtrldComponent } from './ctrld-component';

export class FileUpload extends CtrldComponent<FileList | null, FileUpload.Props> {
    render() {
        return (
            <input
                id={this.props.id}
                name={this.props.id}
                type='file'
                onChange={
                    (e: React.ChangeEvent<HTMLInputElement>) => {
                        let v = e.currentTarget.files;
                        this.props.updateNotifier(v);
                    }
                }
                placeholder={this.props.hint}
                disabled={this.props.disabled}
                className={this.props.className ?? 'file-upload'} />
        );
    }
}

export namespace FileUpload {
    export interface Props extends CtrldComponent.Props<FileList | null> {
        hint?: string;
        className?: string;
        disabled?: boolean;
    }
}

