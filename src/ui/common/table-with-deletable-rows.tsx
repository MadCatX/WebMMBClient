import * as React from 'react';
import { FormUtil, FormUtilClass } from './form';
import { FormContextManager as FCM } from '../form-context-manager';
import { PushButton } from './push-button';

type ArrayType<T> = T extends (infer AT)[] ? AT : never;

export class GTableWithDeletableRows<KE, KV, T, U extends T & Array<any>> extends React.Component<GTableWithDeletableRows.Props<KV, U>> {
    private FU = new FormUtilClass<KE, KV, T>();

    removeRow = (index: number, data: FormUtil.ContextData<KE, KV, T>) => {
        const rows = data.values.get(this.props.valuesKey) as U;
        const item: ArrayType<U> = rows[index];
        rows.splice(index, 1);
        this.FU.updateValue(data, { key: this.props.valuesKey, value: rows });
        if (this.props.deleter !== undefined)
            this.props.deleter(item);
    }

    render() {
        const CtxConsumer = FCM.getContext(this.props.formId).Consumer;

        return (
            <CtxConsumer>
                {(data: FormUtil.ContextData<KE, KV, T>) => {
                    const values = this.FU.getArray<U>(data, this.props.valuesKey);
                    return (
                        <div className={this.props.className}>
                            {this.props.columns.map((col, n) => {
                                const key = `col-${n}`;
                                return (<div key={key} className='column-header'>{col.caption}</div>);
                            })}
                            <div className='column-header'></div>
                            {values.map((v, index) => {
                                return (
                                    <>
                                        {this.props.columns.map((col) => {
                                            if (col.stringify !== undefined)
                                                return (<div className='column-item'>{col.stringify(v[col.k])}</div>);
                                            else
                                                return (<div className='column-item'>{v[col.k]}</div>);
                                        })}
                                        <PushButton
                                            className='pushbutton-delete'
                                            value='-'
                                            onClick={(e) => {
                                                e.preventDefault();
                                                this.removeRow(index, data);
                                            }} />
                                    </>
                                );
                            })
                            }
                        </div>
                    );
                }}
            </CtxConsumer>
        );
    }
}

export namespace GTableWithDeletableRows {
    type ValueOf<T> = ArrayType<T>[keyof ArrayType<T>];

    export interface Deleter<T> {
        (item: ArrayType<T>): void;
    }

    export interface Props<KV, T> {
        className: string;
        formId: string;
        columns: {
            caption: string;
            k: keyof ArrayType<T>;
            stringify?: (v: ValueOf<ArrayType<T>>) => string;
        }[];
        valuesKey: KV;
        deleter?: Deleter<T>;
    }
}

export function TableWithDeletableRows<KE, KV, T, U extends T & Array<any>>() {
    return GTableWithDeletableRows as new(props: GTableWithDeletableRows.Props<KV, T>) => GTableWithDeletableRows<KE, KV, T, U>;
}
