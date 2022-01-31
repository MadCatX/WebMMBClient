/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { MmbSetupComponent } from './mmb-setup-component';
import { ErrorBox } from '../common/error-box';
import { FilesUploadProgress } from '../common/files-upload-progress';
import { FileUploadUtil } from '../common/file-upload-util';
import { PushButton } from '../common/push-button';
import { TableWithDeletableRows } from '../common/table-with-deletable-rows';
import { AdditionalFile, AdditionalFileImpl } from '../../model/mmb/additional-file';
import { FilePicker } from '../common/controlled/file-picker';
import { FileQuery } from '../../mmb/file-query';

const AddedTable = TableWithDeletableRows<AdditionalFile[]>();

interface State {
    currentFile: File|null;
    errors: string[];
    transfers: FileUploadUtil.TransferMap;
}

export class AdditionalFilesInput extends MmbSetupComponent<AdditionalFilesInput.Props, State> {
    private Uploader = FileUploadUtil.Uploader(
        (xfrs: FileUploadUtil.TransferMap) => this.uploadProgressHandler(xfrs),
        (xfrs: FileUploadUtil.TransferMap, errors: string[]) => this.uploadErrorHandler(xfrs, errors),
        (xfrs: FileUploadUtil.TransferMap, file: AdditionalFileImpl) => this.uploadCompletedHandler(xfrs, file),
    );

    constructor(props: AdditionalFilesInput.Props) {
        super(props);

        this.state = {
            currentFile: null,
            errors: [],
            transfers: new Map(),
        };
    }

    private addFile() {
        if (this.state.currentFile === null) {
            this.setState({ ...this.state, errors: ['No file'] } );
            return;
        }

        const f = AdditionalFile.fromFile(this.state.currentFile);
        const ret = this.props.setup.add('additionalFiles', f);
        if (ret)
            this.setState({ ...this.state, errors: ret });
    }

    private cancelUpload() {
        for (const k of this.state.transfers.keys())
            this.Uploader.cancel(k);
    }

    private removeFile(idx: number) {
        const f = this.props.setup.additionalFiles[idx];
        if (f.isUploaded) {
            FileQuery.del(this.props.jobId, f.name).performer().then(() => {
                this.props.setup.removeAt('additionalFiles', idx);
            }).catch(e => {
                this.setState({ ...this.state, errors: [e.toString()] });
            });
        } else
            this.props.setup.removeAt('additionalFiles', idx);
    }

    private uploadCompletedHandler(xfrs: FileUploadUtil.TransferMap, completedFile: AdditionalFileImpl) {
        const idx = this.props.setup.additionalFiles.findIndex(f => f.name === completedFile.name);
        if (idx === -1) {
            console.error(`File ${completedFile.name} finished uploading but was not found in the list of additional files`);
            return;
        }

        // We need to force update here because files are matched by all attributes
        this.props.setup.updateAt('additionalFiles', idx, completedFile, true);
    }

    private uploadErrorHandler(xfrs: FileUploadUtil.TransferMap, errors: string[]) {
        this.setState({ ...this.state, transfers: xfrs, errors });
    }

    private uploadProgressHandler(xfrs: FileUploadUtil.TransferMap) {
        this.setState({ ...this.state, transfers: xfrs });
    }

    private uploadFiles() {
        this.Uploader.upload(this.props.setup.additionalFiles, this.props.jobId);
    }

    componentDidMount() {
        this.subscribe(this.props.setup.events.additionalFiles, () => this.forceUpdate());
    }

    componentWillUnmount() {
        this.cancelUpload();
        this.unsubscribeAll();
    }

    render() {
        const uploadInfos = Array.from(this.state.transfers).map(([name, xfr]) => {
            return (
                {
                    fileName: name,
                    uploadState: xfr.state,
                    doneRatio: xfr.doneRatio,
                    error: xfr.error,
                }
            );
        });
        return (
            <div className='section'>
                <div className='section-caption'>Additional files</div>
                <div className='mol-in-additional-files-input spaced-grid'>
                    <FilePicker
                        id='additional-file-picker'
                        updateNotifier={f => this.setState({ ...this.state, currentFile: f })}
                    />
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={() => this.addFile()}
                    />
                </div>
                <ErrorBox errors={this.state.errors} />
                <AddedTable
                    className='mol-in-additional-files-added spaced-grid'
                    columns={[
                        {
                            caption: 'Name',
                            k: 'name',
                        },
                        {
                            caption: 'Size',
                            k: 'size',
                            stringify: FileUploadUtil.sizeToHuman,
                        },
                        {
                            caption: 'Is uploaded',
                            k: 'isUploaded',
                            stringify: v => v ? 'Yes' : 'No'
                        },
                    ]}
                    data={this.props.setup.additionalFiles}
                    onRemoveRow={idx => this.removeFile(idx)}
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

export namespace AdditionalFilesInput {
    export interface Props extends MmbSetupComponent.Props {
        jobId: string;
    }
}
