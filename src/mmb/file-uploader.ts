/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as Api from './api';
import { Request } from './request';

export namespace FileUploader {
    export interface ErrorReporter {
        (file: File, error: string): void;
    }

    export interface ProgressReporter {
        (file: File, reader: ReadableStreamReader, doneRatio: number, isDone:  boolean): void;
    }

    export function upload(filesToUpload: File[], progRep: ProgressReporter, errRep: ErrorReporter) {
        for (const file of filesToUpload) {
            const reader = file.stream().getReader();

            let bytesRead = 0;
            let rqType: Api.UploadFileRequestType = 'Start';
            reader.read().then(async function readFunc({done, value}) {
                if (done) {
                    const rq: Api.ApiRequest<Api.UploadFileRqData> = {
                        req_type: 'UploadFile',
                        data: {
                            id: '...',
                            req_type: 'Finish',
                            file_name: file.name,
                            data: '',
                        }
                    };

                    Request.api(rq).promise.then(resp => {
                        if (resp.ok)
                            progRep(file, reader, 1, true);
                        else {
                            reader.cancel();
                            errRep(file, `Upload request failed: ${resp.status} - ${resp.statusText}`);
                        }
                    }).catch(e => {
                        errRep(file, e.toString());
                    });
                    return;
                }

                bytesRead += value.length;
                const doneRatio = bytesRead / file.size;

                /* Send as 4 KiB chunks */
                const nChunks = Math.floor(value.length / 4096) + 1;
                for (let idx = 0; idx < nChunks; idx++) {
                    const end = (idx + 1) * 4096 > value.length ? value.length : (idx + 1) * 4096;
                    const slice = value.slice(idx * 4096, end);

                    const rq: Api.ApiRequest<Api.UploadFileRqData> = {
                        req_type: 'UploadFile',
                        data: {
                            id: '...',
                            req_type: rqType,
                            file_name: file.name,
                            data: btoa(String.fromCharCode(...slice)),
                        }
                    };
                    rqType = 'Continue';

                    try {
                        const resp = await Request.api(rq).promise;
                        if (!resp.ok) {
                            reader.cancel();
                            errRep(file, `Upload request failed: ${resp.status} - ${resp.statusText}`);
                            return;
                        }
                    } catch (e) {
                        reader.cancel();
                        errRep(file, e.toString())
                        return;
                    }
                }

                progRep(file, reader, doneRatio, false);
                reader.read().then(readFunc).catch(e => errRep(file, e.toString()));
            }).catch(e => {
                reader.cancel();
                errRep(file, e.toString());
            });
        }
    }
}
