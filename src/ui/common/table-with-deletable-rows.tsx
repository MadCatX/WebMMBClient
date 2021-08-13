/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormModel, FormUtil } from '../../model/common/form';
import { PushButton } from './push-button';

type ArrayType<T> = T extends (infer AT)[] ? AT : never;

export class GTableWithDeletableRows<KE, KV, T, U extends T & Array<any>> extends React.Component<GTableWithDeletableRows.Props<KE, KV, T, U>> {
    private FU = new FormUtil<KE, KV, T>();

    private renderHeader() {
        if (this.props.hideHeader === true)
            return undefined;

        return (
            <>
                {this.props.columns.map((col, n) => {
                    const key = `col-${n}`;
                    return (<div key={key} className='column-header'>{col.caption}</div>);
                })}
                <div className='column-header' key='entries'></div>
            </>
        );
    }

    removeRow = (index: number, data: FormModel.ContextData<KE, KV, T>) => {
        const rows = data.values.get(this.props.valuesKey) as U;
        const item: ArrayType<U> = rows[index];
        rows.splice(index, 1);
        this.FU.updateValue(data, { key: this.props.valuesKey, value: rows });
        if (this.props.deleter !== undefined)
            this.props.deleter(item);
    }

    render() {
        const values = this.FU.getArray<U>(this.props.ctxData, this.props.valuesKey);

        return (
            <div className={this.props.className} key='top'>
                {this.renderHeader()}
                {values.map((v, index) => {
                    return (
                        <React.Fragment key={`row-item-${index}`}>
                            {this.props.columns.map((col, n) => {
                                const key = `col-item-${index}-${n}`
                                if (col.stringify !== undefined)
                                    return (<div className='column-item' key={key}>{col.stringify(v[col.k], v)}</div>);
                                else
                                    return (<div className='column-item' key={key}>{v[col.k]}</div>);
                            })}
                            <PushButton
                                className='pushbutton-common pushbutton-delete'
                                key={`delbtn-${index}`}
                                value='-'
                                onClick={(e) => {
                                    e.preventDefault();
                                    this.removeRow(index, this.props.ctxData);
                                }} />
                        </React.Fragment>
                    );
                })
                }
            </div>
        );
    }
}

export namespace GTableWithDeletableRows {
    type ValueOf<T> = ArrayType<T>[keyof ArrayType<T>];

    export interface Deleter<T> {
        (item: ArrayType<T>): void;
    }

    export interface Props<KE, KV, T, U> {
        ctxData: FormModel.ContextData<KE, KV, T>;
        className: string;
        columns: {
            caption: string;
            k: keyof ArrayType<U>;
            stringify?: (v: ValueOf<ArrayType<U>>, item: ArrayType<U>) => string;
        }[];
        valuesKey: KV;
        deleter?: Deleter<U>;
        hideHeader?: boolean;
    }
}

export function TableWithDeletableRows<KE, KV, T, U extends T & Array<any>>() {
    return GTableWithDeletableRows as new(props: GTableWithDeletableRows.Props<KE, KV, T, U>) => GTableWithDeletableRows<KE, KV, T, U>;
}
