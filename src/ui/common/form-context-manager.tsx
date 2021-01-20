/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormModel } from '../../model/common/form';

function NoFunc() {}

export namespace FormContextManager {
    export function makeContext<KE, KV, T>() {
        return React.createContext<FormModel.ContextData<KE, KV, T>>(
            {
                errors: new Map<KE, string[]>(),
                values: new Map<KV, FormModel.V<T>>(),
                clearErrors: NoFunc,
                clearValues: NoFunc,
                clearErrorsAndValues: NoFunc,
                setErrors: NoFunc,
                setValues: NoFunc,
                setErrorsAndValues: NoFunc,
            },
        );
    }
}
