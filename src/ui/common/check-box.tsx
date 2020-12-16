import * as React from 'react';
import { FormUtil } from './form';
import { FormField } from './form-field';
import { FormContextManager as FCM } from '../form-context-manager';

export class GCheckBox<KE, KV, T> extends FormField<KE, KV, T, GCheckBox.Props<KV>> {
    private isChecked(data: FormUtil.ContextData<KE, KV, T>) {
        return (data.values.get(this.props.keyId) ?? false) as boolean;
    }

    private updateValue(data: FormUtil.ContextData<KE, KV, T>, value: boolean) {
        this.FU.updateValue(data, { key: this.props.keyId, value});
    }

    render() {
        const CtxConsumer = FCM.getContext(this.props.formId).Consumer;

        return (
            <CtxConsumer>
                {(data: FormUtil.ContextData<KE, KV, T>) => {
                    const checked = this.isChecked(data);

                    return (
                        <input
                            className={this.props.className}
                            type='checkbox'
                            id={this.props.id}
                            name={this.props.id}
                            checked={checked}
                            onChange={e => this.updateValue(data, e.currentTarget.checked)} />
                    );
                }}
            </CtxConsumer>
        );
    }
}

export namespace GCheckBox {
    export interface Props<KV> extends FormField.Props<KV> {
        className?: string,
    }
}

export function CheckBox<KE, KV, T>() {
    return GCheckBox as new(props: GCheckBox.Props<KV>) => GCheckBox<KE, KV, T>;
}