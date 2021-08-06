/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AdditionalFileImpl } from './additional-file';

export class DensityFitFile extends AdditionalFileImpl {
    private constructor(public readonly type: DensityFitFile.ContentType, file: File|null, name?: string, size?: number) {
        super(file, name, size);
    }

    static fromFile(type: DensityFitFile.ContentType, file: File) {
        return new DensityFitFile(type, file);
    }

    static fromInfo(type: DensityFitFile.ContentType, name: string, size: number|null) {
        return new DensityFitFile(type, null, name, size ?? undefined);
    }
}

export namespace DensityFitFile {
    export type ContentType = 'structure' | 'density-map';
}
