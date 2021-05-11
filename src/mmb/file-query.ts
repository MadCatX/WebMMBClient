/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FileRequest } from './file-request';
import { ResponseDeserializers } from './response-deserializers';
import { Query as Q } from './query';

export namespace FileQuery {
    export function cancelUpload(jobId: string, transferId: string) {
        return Q.query(() => FileRequest.cancelUpload(jobId, transferId), ResponseDeserializers.toEmpty, 'Cannot cancel file transfer');
    }

    export function del(jobId: string, fileName: string) {
        return Q.query(() => FileRequest.del(jobId, fileName), ResponseDeserializers.toEmpty, 'Cannot delete file');
    }

    export function finishUpload(jobId: string, transferId: string) {
        return Q.query(() => FileRequest.finishUpload(jobId, transferId), ResponseDeserializers.toEmpty, 'Cannot finish file transfer');
    }

    export function initUpload(jobId: string, fileName: string) {
        return Q.query(() => FileRequest.initUpload(jobId, fileName), ResponseDeserializers.toFileTransferAck, 'Cannot initiate file upload');
    }

    export function uploadChunk(jobId: Uint8Array, transferId: Uint8Array, challenge: Uint8Array, data: Uint8Array) {
        return Q.query(() => FileRequest.uploadChunk(jobId, transferId, challenge, data), ResponseDeserializers.toFileTransferAck, 'Cannot upload file chunk');
    }
}
