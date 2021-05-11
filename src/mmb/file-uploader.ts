/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FileQuery } from './file-query';

const utf8Enc = new TextEncoder();
const CHUNK_SIZE = 8 * 1024 * 1024 - 72; /* 8 MiB minus the header size */

function cancelUpload(jobId: string, transferId: string) {
    return new Promise<void>((resolve, _reject) => {
        FileQuery.cancelUpload(jobId, transferId).performer().then(() => {
            resolve();
        }).catch(e => {
            console.warn(`Error when cancelling file transfer: ${e}`);
            resolve(); // Ignore errors
        });
    });
}

function sendChunks(data: Uint8Array, jobId: Uint8Array, transferId: Uint8Array) {
    const nChunks = Math.floor(data.length / CHUNK_SIZE) + 1;

    return new Promise<void>((resolve, reject) => {
        const sender = (idx: number): void => {
            const end = (idx + 1) * CHUNK_SIZE > data.length ? data.length : (idx + 1) * CHUNK_SIZE;
            const chunk = data.slice(idx * CHUNK_SIZE, end);

            FileQuery.uploadChunkUint8(jobId, transferId, chunk).performer().then(resp => {
                if (!resp) {
                    reject('Transfer was aborted before all chunks were sent');
                    return;
                }

                idx++;
                if (idx < nChunks)
                    sender(idx);
                else
                    resolve();
            }).catch(e => reject(e));
        }

        sender(0);
    });
}

export namespace FileUploader {
    export interface ErrorReporter {
        (file: File, error: string): void;
    }

    export interface ProgressReporter {
        (file: File, reader: ReadableStreamReader, transferId: string, doneRatio: number, isDone: boolean): void;
    }

    export function upload(jobId: string, filesToUpload: File[], progRep: ProgressReporter, errRep: ErrorReporter) {
        const jobIdUint8 = utf8Enc.encode(jobId);

        for (const file of filesToUpload) {
            const reader = file.stream().getReader();

            const initQuery = FileQuery.initUpload(jobId, file.name);

            initQuery.performer().then(transferInfo => {
                if (!transferInfo) {
                    errRep(file, 'Transfer was aborted before it started');
                    return;
                }

                const transferId = transferInfo.id;
                const transferIdUint8 = utf8Enc.encode(transferId);
                let bytesRead = 0;
                reader.read().then(function readFunc({done, value}) {
                    if (done) {
                        reader.cancel();
                        if (bytesRead < file.size)
                            return;

                        const finiQuery = FileQuery.finishUpload(jobId, transferInfo.id);
                        finiQuery.performer().then(() => {
                            progRep(file, reader, transferId, 1, true);
                        }).catch(e => {
                            errRep(file, e.toString());
                        });
                        return;
                    }

                    bytesRead += value.length;
                    const doneRatio = bytesRead / file.size;

                    sendChunks(value, jobIdUint8, transferIdUint8).then(
                        () => {
                            progRep(file, reader, transferId, doneRatio, false);
                            reader.read().then(readFunc).catch(e => {
                                reader.cancel();
                                cancelUpload(jobId, transferId).then(() => {
                                    errRep(file, e.toString());
                                });
                            });
                        }
                    ).catch(e => {
                        reader.cancel();
                        cancelUpload(jobId, transferId).then(() => {
                            errRep(file, e.toString());
                        });
                    });
                }).catch(e => {
                    reader.cancel();
                    cancelUpload(jobId, transferId).then(() => {
                        errRep(file, `Cannot upload file: ${e.toString()}`);
                    });
                });
            }).catch(e => errRep(file, e.toString()));
        }
    }
}
