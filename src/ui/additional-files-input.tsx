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
import { PushButton } from './common/push-button';
import { AdditionalFile } from '../model/additional-file';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { FormUtil } from '../model/common/form';
import { FilePicker } from './common/controlled/file-picker';
import { FormBlock } from './common/form/form-block';
import { FileUploader } from '../mmb/file-uploader';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<AdditionalFile[]>();

interface Transfer {
    file: File;
    doneRatio: number;
    state: FilesUploadProgress.UploadState;
    cancel: boolean;
    error: string;
}

interface State {
    currentFile: File|null;
    currentTransfers: Map<string, Transfer>;
    errors: string[];
}

export class AdditionalFilesInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, AdditionalFilesInput.Props, State> {
    constructor(props: AdditionalFilesInput.Props) {
        super(props);

        this.state = {
            currentFile: null,
            currentTransfers: new Map(),
            errors: [],
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
        files.push(new AdditionalFile(this.state.currentFile));

        this.setState({ ...this.state, errors: [] });
        FU.updateValue(data, { key: 'mol-in-additional-files-added', value: files });
    }

    private cancelUpload() {
        const currXfrs = this.state.currentTransfers;
        for (const xfr of currXfrs.values())
            xfr.cancel = true;

        this.setState({ ...this.state, currentTransfers: currXfrs });
    }

    private fileRemoved(file: AdditionalFile) {
        let files = FU.getArray<AdditionalFile[]>(this.props.ctxData, 'mol-in-additional-files-added');
        files = files.filter(f => f.name !== file.name);

        this.setState({ ...this.state, errors: [] });
        FU.updateValue(this.props.ctxData, { key: 'mol-in-additional-files-added', value: files } );
    }

    private uploadFiles() {
        const files = FU.getArray<AdditionalFile[]>(this.props.ctxData, 'mol-in-additional-files-added');
        const toUpload = files.filter(f => f.isUploaded === false).map(f => f.file);

        const xfrs = new Map<string, Transfer>();
        for (const f of toUpload) {
            xfrs.set(
                f.name,
                {
                    file: f,
                    doneRatio: 0,
                    state: 'not-started',
                    cancel: false,
                    error: '',
                }
            );
        }
        this.setState({ ...this.state, currentTransfers: xfrs });

        FileUploader.upload(
            toUpload,
            (file, reader, doneRatio, isDone) => {
                const currXfrs = this.state.currentTransfers;
                const xfr = currXfrs.get(file.name)!;

                if (xfr.cancel) {
                    reader.cancel();
                    xfr.state = 'canceled';
                    this.setState({ ...this.state, currentTransfers: currXfrs });
                    return;
                }

                if (isDone) {
                    const xfiles = FU.getArray<AdditionalFile[]>(this.props.ctxData, 'mol-in-additional-files-added');
                    for (const f of xfiles) {
                        if (f.name === file.name) {
                            f.isUploaded = true;
                            FU.updateValue(this.props.ctxData, { key: 'mol-in-additional-files-added', value: xfiles });

                            xfr.state = 'done';
                            this.setState({ ...this.state, currentTransfers: currXfrs });
                            return;
                        }
                    }
                } else {
                    xfr.state = 'in-progress';
                    xfr.doneRatio = doneRatio;
                    this.setState({ ...this.state, currentTransfers: currXfrs });
                }
            },
            (file, error) => {
                const currXfrs = this.state.currentTransfers;
                const xfr = currXfrs.get(file.name)!;

                xfr.state = 'failed';
                xfr.error = error;
                this.setState({ ...this.state, currentTransfers: currXfrs });
            }
        );
    }

    componentWillUnmount() {
        this.cancelUpload();
    }

    render() {
        const uploadInfos = Array.from(this.state.currentTransfers).map(([name, xfr]) => {
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
                    deleter={f => this.fileRemoved(f)}
                    columns={[
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
    }
}
