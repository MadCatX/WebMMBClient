/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FormUtil } from './common/form';

export namespace LoginFormUtil {
    export type ErrorKeys = 'login-errors';
    export type ValueKeys = 'login-username';
    export type ValueTypes = null;
    export type Values = FormUtil.V<ValueTypes>;

    export type ContextData = FormUtil.ContextData<ErrorKeys, ValueKeys, ValueTypes>;

    export interface Props extends FormUtil.Props<ValueKeys, ValueTypes> {
    }
}
