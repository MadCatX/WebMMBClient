/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FormModel } from './common/form';

export namespace LoginModel {
    export type ErrorKeys = 'login-errors';
    export type ValueKeys = 'login-session-id';
    export type ValueTypes = null;
    export type Values = FormModel.V<ValueTypes>;

    export type ContextData = FormModel.ContextData<ErrorKeys, ValueKeys, ValueTypes>;

    export interface Props extends FormModel.Props<ValueKeys, ValueTypes> {
    }
}
