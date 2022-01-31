/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

export class AdditionalFileImpl implements Comparable, Cloneable {
    public isUploaded: boolean;
    public readonly file: File|null;
    public readonly name: string;
    public readonly size: number|null;

    protected constructor(file: File|null, name?: string, size?: number) {
        this.file = file;

        if (this.file) {
            this.name = this.file.name;
            this.size = this.file.size;
            this.isUploaded = false;
        } else {
            if (!name)
                throw new Error('File name must be provided when File object is null');
            this.name = name;
            this.size = size ?? null;
            this.isUploaded = true;
        }
    }

    clone() {
        const ret = new AdditionalFileImpl(this.file, this.name, this.size ? this.size : undefined);
        ret.isUploaded = this.isUploaded;

        return ret;
    }

    equals(other: AdditionalFileImpl) {
        // Assume that sizes match if at least one file does not have a known size
        const sizeMatch = (other.size !== null && this.size !== null) ? other.size === this.size : true;
        return other.name === this.name && other.isUploaded === this.isUploaded && sizeMatch;
    }
}

export class AdditionalFile extends AdditionalFileImpl {
    private constructor(file: File|null, name?: string, size?: number) {
        super(file, name, size);
    }

    static fromFile(file: File) {
        return new AdditionalFileImpl(file);
    }

    static fromInfo(name: string, size: number|null) {
        return new AdditionalFileImpl(null, name, size ?? undefined);
    }
}

