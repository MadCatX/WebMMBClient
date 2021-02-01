/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormModel, FormUtil } from '../../../model/common/form';

export abstract class FormField<KE, KV, T, P extends FormField.Props<KE, KV, T>, S = any> extends React.Component<P, S> {
    protected FU = new FormUtil<KE, KV, T>();
}

export namespace FormField {
    export interface Props<KE, KV, T> {
        keyId: KV;
        ctxData: FormModel.ContextData<KE, KV, T>;
        id: string;
    }
}
