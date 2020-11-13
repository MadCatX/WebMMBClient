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
