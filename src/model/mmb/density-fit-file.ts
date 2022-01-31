/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AdditionalFileImpl } from './additional-file';
import { Cloneable } from '../../util/cloneable';

export class DensityFitFile extends AdditionalFileImpl implements Cloneable {
    private constructor(public readonly type: DensityFitFile.ContentType, file: File|null, name?: string, size?: number) {
        super(file, name, size);
    }

    clone() {
        const cloned = !this.file ?
            new DensityFitFile(this.type, null, this.name, this.size!)
            :
            new DensityFitFile(this.type, this.file);
        cloned.isUploaded = this.isUploaded;

        return cloned;
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
