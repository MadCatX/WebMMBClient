import * as React from 'react';
import { FormUtil } from './form';
import { FormField } from './form-field';
import { FormContextManager as FCM } from '../form-context-manager';

export class GTextArea<KE, KV extends string, T> extends FormField<KE, KV, T, GTextArea.Props<KV>> {
    private getValue(ctx: FormUtil.ContextData<KE, KV, T>) {
        const value = ctx.values.get(this.props.keyId);
        if (typeof value !== 'string')
            return '';
        return value;
    }

    render() {
        const CtxConsumer = FCM.getContext(this.props.formId).Consumer;

        return (
            <CtxConsumer>
                {(ctx: FormUtil.ContextData<KE, KV, T>) => (
                    <textarea
                        id={this.props.id as unknown as string}
                        name={this.props.id as unknown as string}
                        onChange={
                            (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                const v = this.FU.emptyValues();
                                v.set(this.props.keyId, e.currentTarget.value);
                                ctx.setValues(v);
                            }
                        }
                        placeholder={this.props.hint}
                        readOnly={this.props.readonly}
                        spellCheck={this.props.spellcheck}
                        rows={this.props.rows}
                        cols={this.props.columns}
                        value={this.getValue(ctx)}
                        className={this.props.className} />
                )
                }
            </CtxConsumer>
        );
    }
}

export namespace GTextArea {
    export interface Props<KV> extends FormField.Props<KV> {
        hint?: string;
        rows?: number;
        columns?: number;
        readonly?: boolean;
        spellcheck?: boolean;
        className?: string;
    }
}

export function TextArea<KE, KV extends string, T>() {
    return GTextArea as new(props: GTextArea.Props<KV>) => GTextArea<KE, KV, T>;
}
