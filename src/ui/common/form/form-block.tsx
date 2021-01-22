/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormModel } from '../../../model/common/form';

export abstract class FormBlock<KE, KV, V, T extends FormBlock.Props<KE, KV, V>, S = {}> extends React.Component<T, S> {
}

export namespace FormBlock {
    export interface Props<KE, KV, V> {
        ctxData: FormModel.ContextData<KE, KV, V>;
    }
}
