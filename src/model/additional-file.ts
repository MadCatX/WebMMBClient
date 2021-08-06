/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export class AdditionalFileImpl {
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
}

export class AdditionalFile extends AdditionalFileImpl {
    private constructor(file: File|null, name?: string, size?: number) {
        super(file, name, size);
    }

    static fromFile(file: File) {
        return new AdditionalFileImpl(file);
    }

    static fromInfo(name: string, size: number) {
        return new AdditionalFileImpl(null, name, size);
    }
}

