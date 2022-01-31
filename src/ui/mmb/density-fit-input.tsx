/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';

import { MmbSetupComponent } from './mmb-setup-component';
import { TableWithDeletableRows } from '../common/table-with-deletable-rows';
import { ErrorBox } from '../common/error-box';
import { FilePicker } from '../common/controlled/file-picker';
import { FilesUploadProgress } from '../common/files-upload-progress';
import { FileUploadUtil } from '../common/file-upload-util';
import { PushButton } from '../common/push-button';
import { FileQuery } from '../../mmb/file-query';
import { DensityFitFile } from '../../model/mmb/density-fit-file';
import { DensityFitFiles } from '../../model/mmb/density-fit-files';
import { Structural } from '../../structural/index';

const AddedTable = TableWithDeletableRows<DensityFitFile[]>();

function arraify(files: DensityFitFiles) {
    const af = new Array<DensityFitFile>();
    if (files.structure)
        af.push(files.structure);
    if (files.densityMap)
        af.push(files.densityMap);
    return af;
}

interface State {
    transfers: FileUploadUtil.TransferMap;
    errors: string[];
}

export class DensityFitInput extends MmbSetupComponent<DensityFitInput.Props, State> {
    private Uploader = FileUploadUtil.Uploader(
        (xfrs: FileUploadUtil.TransferMap) => this.uploadProgressHandler(xfrs),
        (xfrs: FileUploadUtil.TransferMap, errors: string[]) => this.uploadErrorHandler(xfrs, errors),
        (xfrs: FileUploadUtil.TransferMap, completed: DensityFitFile) => this.uploadCompletionHandler(xfrs, completed),
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

    private clearErrors() {
        this.setState({ ...this.state, errors: [] });
    }

    private async fillStructureFromFile(file: File) {
        try {
            const chains = await Structural.extractChainsFromStructureFile(file);
            const compounds = Structural.chainsToCompounds(chains);

            for (const c of compounds) {
                const errors = this.props.setup.add('compounds', c);
                if (errors) {
                    this.setState({ ...this.state, errors });
                    return;
                }
            }
        } catch (e) {
            return [(e as Error).toString()];
        }
    }

    private async removeFile(file: DensityFitFile) {
        const files = this.props.setup.densityFitFiles;

        if (file.isUploaded) {
            try {
                await FileQuery.del(this.props.jobId, file.name).performer();
            } catch (e) {
                this.setState({ ...this.state, errors: [(e as Error).toString()] });
                return;
            }
        }

        switch (file.type) {
        case 'structure':
            files.structure = null;
            break;
        case 'density-map':
            files.densityMap = null;
            break;
        }

        const errors = this.props.setup.set('densityFitFiles', files);
        if (errors)
            this.setState({ ...this.state, errors });

        if (file.type === 'structure') {
            const toRemove = this.props.setup.compounds;
            this.props.setup.removeMany('compounds', toRemove);
        }
    }

    private setFile(file: File, type: DensityFitFile.ContentType) {
        this.clearErrors();

        const files = this.props.setup.densityFitFiles;
        const denFile = DensityFitFile.fromFile(type, file);

        if (type === 'structure') {
            this.fillStructureFromFile(file).then(errors => {
                if (errors)
                    this.setState({ ...this.state, errors });
                else {
                    files.structure = denFile;

                    errors = this.props.setup.set('densityFitFiles', files);
                    if (errors)
                        this.setState({ ...this.state, errors });
                }
            });
        } else if (type === 'density-map') {
            files.densityMap = denFile;

            const errors = this.props.setup.set('densityFitFiles', files);
            if (errors)
                this.setState({ ...this.state, errors });
        }
    }

    private uploadFiles() {
        const toUpload = new Array<DensityFitFile>();
        const files = this.props.setup.densityFitFiles;

        if (files.structure && !files.structure.isUploaded)
            toUpload.push(files.structure);
        if (files.densityMap && !files.densityMap.isUploaded)
            toUpload.push(files.densityMap);

        this.Uploader.upload(toUpload, this.props.jobId);
    }

    private uploadCompletionHandler(xfrs: FileUploadUtil.TransferMap, completed: DensityFitFile) {
        const files = this.props.setup.densityFitFiles;
        if (files.structure && completed.type === 'structure')
            files.structure = completed;
        else if (files.densityMap && completed.type === 'density-map')
            files.densityMap = completed;

        this.props.setup.set('densityFitFiles', files);
    }

    private uploadErrorHandler(xfrs: FileUploadUtil.TransferMap, errors: string[]) {
        this.setState({ ...this.state, transfers: xfrs, errors });
    }

    private uploadProgressHandler(xfrs: FileUploadUtil.TransferMap) {
        this.setState({ ...this.state, transfers: xfrs });
    }

    componentDidMount() {
        this.subscribe(this.props.setup.events.densityFitFiles, () => this.forceUpdate());
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
                    error: xfr.error
                }
            );
        });
        return (
            <div className='section'>
                <div className='section-caption'>Density fit data</div>
                <div className='mol-in-density-fit-select-files'>
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
                    className='mol-in-density-fit-files-added spaced-grid'
                    columns={[
                        {
                            caption: 'Type',
                            k: 'type',
                            stringify: (type: DensityFitFile.ContentType) => {
                                switch (type) {
                                case 'structure':
                                    return 'Structure';
                                case 'density-map':
                                    return 'Density map';
                                }
                            },
                        },
                        {
                            caption: 'Name',
                            k: 'name',
                        },
                        {
                            caption: 'Size',
                            k: 'size',
                            stringify: FileUploadUtil.sizeToHuman
                        },
                        {
                            caption: 'Is uploaded',
                            k: 'isUploaded',
                            stringify: v => v ? 'Yes' : 'No'
                        },
                    ]}
                    data={arraify(this.props.setup.densityFitFiles)}
                    onRemoveRow={(_idx, f) => this.removeFile(f)}
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
                <ErrorBox errors={this.state.errors} />
            </div>
        );
    }
}

export namespace DensityFitInput {
    export interface Props extends MmbSetupComponent.Props {
        jobId: string;
    }
}
