/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';

export class CtrldComponent<T, P extends CtrldComponent.Props<T>, S = {}> extends React.Component<P, S> {
}

export namespace CtrldComponent {
    export interface Modifier {
        (v: string): string;
    }

    export interface UpdateNotifier<T> {
        (v: T): void;
    }

    export interface Validator {
        (v: string): boolean;
    }

    export interface Props<T> {
        id: string;
        updateNotifier: UpdateNotifier<T>;
        value?: T;
        modifier?: Modifier;
        validator?: Validator;
    }
}

