/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export namespace ComboBoxModel {
    export type Option<T> = {
        value: T;
        caption: string;
    }

    export interface Stringifier<T> {
        (v?: T): string;
    }
}
