/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ErrorBox } from './common/error-box';
import { FilesUploadProgress } from './common/files-upload-progress';
import { FileUploadUtil } from './common/file-upload-util'
import { PushButton } from './common/push-button';
import { AdditionalFile } from '../model/additional-file';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { FormUtil } from '../model/common/form';
import { FilePicker } from './common/controlled/file-picker';
import { FormBlock } from './common/form/form-block';
import { FileQuery } from '../mmb/file-query';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<AdditionalFile[]>();

interface State {
    currentFile: File|null;
    errors: string[];
    transfers: FileUploadUtil.TransferMap;
}

export class AdditionalFilesInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, AdditionalFilesInput.Props, State> {
    private Uploader = FileUploadUtil.Uploader(
        'mol-in-additional-files-added',
        (xfrs: FileUploadUtil.TransferMap) => this.uploadProgressHandler(xfrs),
        (xfrs: FileUploadUtil.TransferMap, errors: string[]) => this.uploadErrorHandler(xfrs, errors),
    );

    constructor(props: AdditionalFilesInput.Props) {
        super(props);

        this.state = {
            currentFile: null,
            errors: [],
            transfers: new Map(),
        };
    }

    private addFile(data: MIM.ContextData) {
        if (this.state.currentFile === null) {
            this.setState({ ...this.state, errors: ['No file'] } );
            return;
        }

        const files = FU.getArray<AdditionalFile[]>(data, 'mol-in-additional-files-added');
        if (files.find(f => f.name === this.state.currentFile!.name)) {
            this.setState({ ...this.state, errors: ['File already exists'] } );
            return;
        }
        files.push(AdditionalFile.fromFile(this.state.currentFile));

        this.setState({ ...this.state, errors: [] });
        FU.updateValue(data, { key: 'mol-in-additional-files-added', value: files });
    }

    private cancelUpload() {
        for (const k of this.state.transfers.keys())
            this.Uploader.cancel(k);
    }

    private fileRemoved(file: AdditionalFile) {
        FileQuery.del(this.props.jobId, file.name).performer().then(() => {
            let files = FU.getArray<AdditionalFile[]>(this.props.ctxData, 'mol-in-additional-files-added');
            files = files.filter(f => f.name !== file.name);

            this.setState({ ...this.state, errors: [] });
            FU.updateValue(this.props.ctxData, { key: 'mol-in-additional-files-added', value: files } );
        }).catch(e => {
            this.setState({ ...this.state, errors: [e.toString()] });
        });
    }

    private uploadErrorHandler(xfrs: FileUploadUtil.TransferMap, errors: string[]) {
        this.setState({ ...this.state, transfers: xfrs, errors });
    }

    private uploadProgressHandler(xfrs: FileUploadUtil.TransferMap) {
        this.setState({ ...this.state, transfers: xfrs });
    }

    private uploadFiles() {
        this.Uploader.upload(this.props.ctxData, this.props.jobId);
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
                <div className='section-caption'>Additional files</div>
                <div className='mol-in-additional-files-input spaced-grid'>
                    <FilePicker
                        id='additional-file-picker'
                        updateNotifier={f => { this.setState({ ...this.state, currentFile: f }) }}
                    />
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={e => {
                            e.preventDefault();
                            this.addFile(this.props.ctxData);
                        }}
                    />
                </div>
                <ErrorBox errors={this.state.errors} />
                <AddedTable
                    className='mol-in-additional-files-added spaced-grid'
                    valuesKey='mol-in-additional-files-added'
                    onRowDeleted={f => this.fileRemoved(f)}
                    columns={[
                        { caption: 'Name', k: 'name' },
                        { caption: 'Size', k: 'size', stringify: FileUploadUtil.sizeToHuman },
                        { caption: 'Is uploaded', k: 'isUploaded', stringify: v => v ? 'Yes' : 'No'},
                    ]}
                    ctxData={this.props.ctxData} />
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

export namespace AdditionalFilesInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
        jobId: string;
    }
}
