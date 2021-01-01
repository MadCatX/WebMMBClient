import * as React from 'react';
import { FormUtil } from './form';
import { FormField } from './form-field';
import { FormContextManager as FCM } from './form-context-manager';
import { UiUtil } from '../util';

export class GComboBox<KE, KV extends string, T, U extends FormUtil.V<T>> extends FormField<KE, KV, T, GComboBox.Props<KV, T, U>> {
    private getValue(data: FormUtil.ContextData<KE, KV, T>) {
        const value = data.values.get(this.props.keyId);
        return UiUtil.toString(value);
    }

    private updateValue(data: FormUtil.ContextData<KE, KV, T>, value: string) {
        const cv = this.props.converter === undefined ? value : this.props.converter(value);
        this.FU.updateValue(data, { key: this.props.keyId, value: cv});
    }

    render() {
        const CtxConsumer = FCM.getContext(this.props.formId).Consumer;

        return (
            <CtxConsumer>
                {(data: FormUtil.ContextData<KE, KV, T>) => {
                    const value = this.props.forcedValue ?? this.getValue(data);

                    return (
                        <select
                            id={this.props.id}
                            name={this.props.id}
                            value={value}
                            onChange={
                                (e: React.ChangeEvent<HTMLSelectElement>) => {
                                    this.updateValue(data, e.currentTarget.value);
                                }
                            }
                            onBlur={
                                (e: React.FocusEvent<HTMLSelectElement>) => {
                                    this.updateValue(data, e.currentTarget.value);
                                }
                            }>
                            {this.props.options.map((opt) =>
                                (
                                    <option
                                        key={opt.value}
                                        value={opt.value}
                                    >{opt.caption}</option>
                                ))
                            }
                            className={this.props.className}
                        </select>);
                }
                }
            </CtxConsumer>
        );
    }
}

export namespace GComboBox {
    export type Option = {
        caption: string,
        value: string,
    }

    export interface Props<KV, T, U extends FormUtil.V<T>> extends FormField.Props<KV> {
        options: Option[];
        converter?: (s: string) => U;
        className?: string;
        selected?: string;
        forcedValue?: string;
    }
}

export function ComboBox<KE, KV extends string, T, U extends FormUtil.V<T>>() {
    return GComboBox as new(props: GComboBox.Props<KV, T, U>) => GComboBox<KE, KV, T, U>;
}
