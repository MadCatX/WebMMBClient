/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormUtil } from './form'

export abstract class FormBlock<KE, KV, V, T extends FormBlock.Props<KE, KV, V>, S = {}> extends React.Component<T, S> {
}

export namespace FormBlock {
    export interface Props<KE, KV, V> {
        formId: string;
        ctxData: FormUtil.ContextData<KE, KV, V>;
    }
}
