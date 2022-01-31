/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FileQuery } from './file-query';

const utf8Enc = new TextEncoder();
const CHUNK_SIZE = 8 * 1024 * 1024 - 76; /* 8 MiB minus the header size */

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

function numChunks(size: number, chunkSize: number) {
    const nChunks = Math.floor(size / chunkSize);
    const lastChunk = (size - nChunks * CHUNK_SIZE) > 0 ? 1 : 0;

    return nChunks + lastChunk;
}

export namespace FileUploader {
    export interface ErrorReporter {
        (file: File, error: string): void;
    }

    export interface ProgressReporter {
        (file: File, transferId: string, doneRatio: number, isDone: boolean): void;
    }

    export function upload(jobId: string, filesToUpload: File[], progRep: ProgressReporter, errRep: ErrorReporter) {
        const jobIdUint8 = utf8Enc.encode(jobId);

        for (const file of filesToUpload) {
            const buffer = file.arrayBuffer();

            const initQuery = FileQuery.initUpload(jobId, file.name);

            initQuery.performer().then(ack=> {
                if (!ack) {
                    errRep(file, 'Transfer was aborted before it started');
                    return;
                }

                const transferId = ack.id;
                const transferIdUint8 = utf8Enc.encode(transferId);
                const sz = file.size;
                let bytesRead = 0;

                buffer.then(async (buf) => {
                    const nChunks = numChunks(file.size, CHUNK_SIZE);
                    const data = new Uint8Array(buf);

                    for (let idx = 0 ; idx < nChunks; idx++) {
                        const from = idx * CHUNK_SIZE;
                        const to = (idx + 1) * CHUNK_SIZE > data.length ? data.length : (idx + 1) * CHUNK_SIZE;

                        try {
                            await FileQuery.uploadChunk(jobIdUint8, transferIdUint8, idx, data.slice(from, to)).performer();
                            bytesRead += to - from; // "to" is the index of the first element that is *not* xfrd, hence no +1
                            const doneRatio = bytesRead / sz;
                            progRep(file, transferId, doneRatio, false);
                        } catch (e) {
                            cancelUpload(jobId, transferId).then(() => {
                                errRep(file, `Cannot upload file: ${(e as Error).toString()}`);
                            });
                            return;
                        }
                    }

                    try {
                        await FileQuery.finishUpload(jobId, transferId).performer();
                        progRep(file, transferId, 1, true);
                    } catch(e) {
                        errRep(file, (e as Error).toString());
                    }
                }).catch(e => {
                    cancelUpload(jobId, transferId).then(() => {
                        errRep(file, `Cannot upload file: ${e.toString()}`);
                    });
                });
            }).catch(e => errRep(file, e.toString()));
        }
    }
}
