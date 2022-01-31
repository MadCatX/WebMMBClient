/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FileQuery } from '../../mmb/file-query';
import { FileUploader } from '../../mmb/file-uploader';
import { AdditionalFileImpl } from '../../model/mmb/additional-file';
import { FilesUploadProgress } from './files-upload-progress';

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

    export interface CompletionHandler<TFile extends AdditionalFileImpl> {
        (xfrs: TransferMap, completed: TFile): void;
    }

    export interface ErrorHandler {
        (xfrs: TransferMap, errors: string[]): void;
    }

    export interface ProgressHandler {
        (xfrs: TransferMap): void;
    }

    export function Uploader<TFile extends AdditionalFileImpl>(progressHandler: ProgressHandler, errorHandler: ErrorHandler, completionHandler: CompletionHandler<TFile>) {
        const xfrs = new Map<string, Transfer>();
        return {
            cancel: (xfrId: string) => {
                const xfr = xfrs.get(xfrId);
                if (xfr)
                    xfr.cancel = true;
            },
            upload: (files: TFile[], jobId: string) => {
                xfrs.clear();
                for (const f of files) {
                    xfrs.set(
                        f.name,
                        {
                            file: f.file!,
                            doneRatio: 0,
                            state: 'not-started',
                            cancel: false,
                            error: '',
                        }
                    );
                }

                FileUploader.upload(
                    jobId,
                    files.map(f => f.file!),
                    (file, transferId, doneRatio, isDone) => {
                        const xfr = xfrs.get(file.name)!;

                        if (xfr.cancel) {
                            FileQuery.cancelUpload(jobId, transferId).performer().then(() => {
                                xfr.state = 'canceled';
                                progressHandler(cpyXfrs(xfrs));
                            }).catch(e => {
                                errorHandler(cpyXfrs(xfrs), [e.toString()]);
                            });
                            return;
                        }

                        if (isDone) {
                            for (const f of files) {
                                if (f.name === file.name) {
                                    xfr.state = 'done';

                                    f.isUploaded = true;
                                    progressHandler(cpyXfrs(xfrs));
                                    completionHandler(cpyXfrs(xfrs), f);
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

