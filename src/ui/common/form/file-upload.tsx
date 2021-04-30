/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormField } from './form-field';

export class FFileUpload<KE, KV extends string> extends FormField<KE, KV, FileList | null, FileUpload.Props<KE, KV>> {
    private setValue(v: FileList | null) {
        const nv = this.FU.emptyValues();
        nv.set(this.props.keyId, v);
        this.props.ctxData.setValues(nv);
    }

    render() {
        return (
            <input
                id={this.props.id}
                name={this.props.id}
                type='file'
                onChange={
                    (e: React.ChangeEvent<HTMLInputElement>) => {
                        let v = e.currentTarget.files;
                        this.setValue(v);
                    }
                }
                placeholder={this.props.hint}
                disabled={this.props.disabled}
                className={this.props.className ?? 'file-upload'} />
        );
    }
}

export namespace FileUpload {
    export interface Props<KE, KV> extends FormField.Props<KE, KV, FileList | null> {
        hint?: string,
        className?: string,
        disabled?: boolean,
    }

    export function Spec<KE, KV extends string>() {
        return FFileUpload as new(props: FileUpload.Props<KE, KV>) => FFileUpload<KE, KV>;
    }
}
