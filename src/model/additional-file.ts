/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export class AdditionalFile {
    public isUploaded = false;
    public readonly name: string;
    public readonly size: number;

    constructor(public readonly file: File) {
        this.name = file.name;
        this.size = file.size;
    }
}
