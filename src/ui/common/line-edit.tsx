import * as React from 'react';
import { FormUtil } from './form';
import { FormField } from './form-field';
import { FormContextManager as FCM } from '../form-context-manager';
import { UiUtil } from '../util';

export class GLineEdit<KE, KV extends string, T> extends FormField<KE, KV, T, GLineEdit.Props<KV>> {
    private getValue(ctx: FormUtil.ContextData<KE, KV, T>) {
        const value = ctx.values.get(this.props.keyId)!;
        return UiUtil.toString(value);
    }

    render() {
        const CtxConsumer = FCM.getContext(this.props.formId).Consumer;

        return (
            <CtxConsumer>
                {(ctx: FormUtil.ContextData<KE, KV, T>) =>
                    (
                        <input
                            name={this.props.id}
                            type="text"
                            onChange={
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const v = this.FU.emptyValues();
                                    v.set(this.props.keyId, e.currentTarget.value);
                                    ctx.setValues(v);
                                }
                            }
                            value={this.getValue(ctx)}
                            placeholder={this.props.hint}
                            className={this.props.className}/>)
                }
            </CtxConsumer>
        );
    }
}

export namespace GLineEdit {
    export interface Props<KV> extends FormField.Props<KV> {
        hint?: string,
        defaultValue?: string,
        className?: string,
    }
}

export function LineEdit<KE, KV extends string, T>() {
    return GLineEdit as new(props: GLineEdit.Props<KV>) => GLineEdit<KE, KV, T>;
}
