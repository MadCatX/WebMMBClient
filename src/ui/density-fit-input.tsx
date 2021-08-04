/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FilePicker } from './common/controlled/file-picker';
import { FilesUploadProgress } from './common/files-upload-progress';
import { FileUploadUtil } from './common/file-upload-util'
import { FormBlock } from './common/form/form-block';
import { PushButton } from './common/push-button';
import { FormUtil } from '../model/common/form';
import { DensityFitFile } from '../model/density-fit-file';
import { MmbInputModel as MIM } from '../model/mmb-input-model';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<DensityFitFile[]>();

interface State {
    transfers: FileUploadUtil.TransferMap;
    errors: string[];
}

export class DensityFitInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, DensityFitInput.Props, State> {
    private Uploader = FileUploadUtil.Uploader(
        'mol-in-density-fit-files-added',
        (xfrs: FileUploadUtil.TransferMap) => this.uploadProgressHandler(xfrs),
        (xfrs: FileUploadUtil.TransferMap, errors: string[]) => this.uploadErrorHandler(xfrs, errors),
    );

    constructor(props: DensityFitInput.Props) {
        super(props);

        this.state = {
            transfers: new Map(),
            errors: [],
        };
    }

    private cancelUpload() {
        for (const k of this.state.transfers.keys())
            this.Uploader.cancel(k);
    }

    private removeFile(file: DensityFitFile) {
        let files = FU.getArray<DensityFitFile[]>(this.props.ctxData, 'mol-in-density-fit-files-added');

        files = files.filter(f => f.type != file.type);
        FU.updateValue(this.props.ctxData, { key: 'mol-in-density-fit-files-added', value: files });
    }

    private setFile(file: File, type: DensityFitFile.ContentType) {
        let files = FU.getArray<DensityFitFile[]>(this.props.ctxData, 'mol-in-density-fit-files-added');

        const existing = files.findIndex(f => f.type == type);
        if (existing > -1)
            files.splice(existing, 1);

        files.push(DensityFitFile.fromFile(type, file));
        FU.updateValue(this.props.ctxData, { key: 'mol-in-density-fit-files-added', value: files });
    }

    private uploadFiles() {
        this.Uploader.upload(this.props.ctxData, this.props.jobId);
    }

    private uploadErrorHandler(xfrs: FileUploadUtil.TransferMap, errors: string[]) {
        this.setState({ ...this.state, transfers: xfrs, errors });
    }

    private uploadProgressHandler(xfrs: FileUploadUtil.TransferMap) {
        this.setState({ ...this.state, transfers: xfrs });
    }

    componentWillUnmount() {
        this.cancelUpload();
    }

    render() {
        const uploadInfos = Array.from(this.state.transfers).map(([name, xfr]) => {
            return (
                {
                    fileName: name,
                    uploadState: xfr.state,
                    doneRatio: xfr.doneRatio,
                    error: xfr.error
                }
            );
        });
        return (
            <div className='section'>
                <div className='section-caption'>Density fit data</div>
                <div className='mol-in-density-fit-data'>
                    <div>Structure file (PDB/mmCif)</div>
                    <FilePicker
                        id='additional-file-picker'
                        updateNotifier={f => this.setFile(f, 'structure')}
                    />
                    <div>Density map file</div>
                    <FilePicker
                        id='additional-file-picker'
                        updateNotifier={f => this.setFile(f, 'density-map')}
                    />
                </div>
                <AddedTable
                    className='mol-in-density-files-added spaced-grid'
                    valuesKey='mol-in-density-fit-files-added'
                    deleter={f => this.removeFile(f)}
                    columns={[
                        { caption: 'Type', k: 'type', stringify: (type: DensityFitFile.ContentType) => {
                            switch (type) {
                            case 'structure':
                                return 'Structure';
                            case 'density-map':
                                return 'Density map';
                            }
                        }},
                        { caption: 'Name', k: 'name' },
                        { caption: 'Size', k: 'size', stringify: (sz: number) => {
                            const units = [ 'bytes', 'KiB', 'MiB', 'GiB' ];

                            let idx = 0;
                            for (; idx < units.length - 1; idx++) {
                                if (sz < 1024)
                                    return `${sz.toPrecision(3)} ${units[idx]}`;
                                sz /= 1024;
                            }

                            return `${sz.toPrecision(3)} ${units[idx]}`;
                        }},
                        { caption: 'Is uploaded', k: 'isUploaded', stringify: v => v ? 'Yes' : 'No'},
                    ]}
                    ctxData={this.props.ctxData}
                />
                <PushButton
                    value='Upload files'
                    onClick={() => this.uploadFiles()}
                />
                <PushButton
                    value='Cancel upload'
                    onClick={() => this.cancelUpload()}
                />
                <FilesUploadProgress infos={uploadInfos} />
            </div>
        );
    }
}

export namespace DensityFitInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
        jobId: string;
    }
}
