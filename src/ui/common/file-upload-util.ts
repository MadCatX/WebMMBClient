/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FileQuery } from '../../mmb/file-query';
import { FileUploader } from '../../mmb/file-uploader';
import { FormUtil } from '../../model/common/form';
import { AdditionalFileImpl } from '../../model/additional-file';
import { MmbInputModel as MIM } from '../../model/mmb-input-model';
import { FilesUploadProgress } from './files-upload-progress';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();

function cpyXfrs(xfrs: FileUploadUtil.TransferMap) {
    const m = new Map<string, FileUploadUtil.Transfer>();
    for (const [k,v] of xfrs.entries()) {
        const c = Object.assign({}, v);
        m.set(k, c);
    }
    return m;
}

export namespace FileUploadUtil {
    export interface Transfer {
        file: File;
        doneRatio: number;
        state: FilesUploadProgress.UploadState;
        cancel: boolean;
        error: string;
    }

    export type TransferMap = Map<string, Transfer>;

    export interface ErrorHandler {
        (xfrs: TransferMap, errors: string[]): void;
    }

    export interface ProgressHandler {
        (xfrs: TransferMap): void;
    }

    export interface CancelFunc {
        (id: string): void;
    }

    export interface UploadFunc {
        (data: MIM.ContextData, jobId: string): void;
    }

    export function Uploader(key: MIM.ValueKeys, progressHandler: ProgressHandler, errorHandler: ErrorHandler) {
        const xfrs = new Map<string, Transfer>();
        return {
            cancel: (xfrId: string) => {
                const xfr = xfrs.get(xfrId);
                if (xfr)
                    xfr.cancel = true;
            },
            upload: (data: MIM.ContextData, jobId: string) => {
                const files = FU.getArray<AdditionalFileImpl[]>(data, key);
                const toUpload = files.filter(f => f.isUploaded === false && f.file).map(f => f.file!);

                xfrs.clear();
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

                FileUploader.upload(
                    jobId,
                    toUpload,
                    (file, reader, transferId, doneRatio, isDone) => {
                        const xfr = xfrs.get(file.name)!;

                        if (xfr.cancel) {
                            reader.cancel();
                            FileQuery.cancelUpload(jobId, transferId).performer().then(() => {
                                xfr.state = 'canceled';
                                progressHandler(cpyXfrs(xfrs));
                            }).catch(e => {
                                errorHandler(cpyXfrs(xfrs), [e.toString()]);
                            });
                            return;
                        }

                        if (isDone) {
                            const xfiles = FU.getArray<AdditionalFileImpl[]>(data, key);
                            for (const f of xfiles) {
                                if (f.name === file.name) {
                                    f.isUploaded = true;
                                    FU.updateValue(data, { key, value: xfiles });

                                    xfr.state = 'done';
                                    progressHandler(cpyXfrs(xfrs));
                                    return;
                                }
                            }
                        } else {
                            xfr.state = 'in-progress';
                            xfr.doneRatio = doneRatio;
                            progressHandler(cpyXfrs(xfrs));
                        }
                    },
                    (file, error) => {
                        const xfr = xfrs.get(file.name)!;

                        xfr.state = 'failed';
                        xfr.error = error;
                        progressHandler(cpyXfrs(xfrs));
                    }
                );
            }
        };
    }

    export function sizeToHuman(size: number|null) {
        if (size === null)
            return 'N/A';

        const units = [ 'bytes', 'KiB', 'MiB', 'GiB' ];

        let idx = 0;
        for (; idx < units.length - 1; idx++) {
            if (size < 1024)
                return `${size.toPrecision(3)} ${units[idx]}`;
            size /= 1024;
        }

        return `${size.toPrecision(3)} ${units[idx]}`;
    }
}

