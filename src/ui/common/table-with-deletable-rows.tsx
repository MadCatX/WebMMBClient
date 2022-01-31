/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { PushButton } from './push-button';
import { Dearray } from '../../util/types';

export class GTableWithDeletableRows<T extends Array<any>> extends React.Component<GTableWithDeletableRows.Props<T>> {
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

    private removeRow(idx: number) {
        this.props.onRemoveRow(idx, this.props.data[idx]);
    }

    render() {
        return (
            <div className={this.props.className} key='top'>
                {this.renderHeader()}
                {this.props.data.map((v, index) => {
                    return (
                        <React.Fragment key={index}>
                            {this.props.columns.map((col, n) => {
                                const key = n;
                                if (col.stringify !== undefined)
                                    return (<div className='column-item' key={key}>{col.stringify(v[col.k], v)}</div>);
                                else
                                    return (<div className='column-item' key={key}>{v[col.k]}</div>);
                            })}
                            <PushButton
                                className='pushbutton-common pushbutton-delete'
                                value='-'
                                onClick={() => this.removeRow(index) }
                            />
                        </React.Fragment>
                    );
                })
                }
            </div>
        );
    }
}

export namespace GTableWithDeletableRows {
    type ValueOf<T> = Dearray<T>[keyof Dearray<T>];

    export interface OnRemoveRow<T> {
        (index: number, item: T): void;
    }

    export interface Props<T extends Array<any>> {
        className: string;
        data: T;
        columns: {
            caption: string;
            k: keyof Dearray<T>;
            stringify?: (v: ValueOf<Dearray<T>>, item: Dearray<T>) => string;
        }[];
        hideHeader?: boolean;
        onRemoveRow: OnRemoveRow<Dearray<T>>;
    }
}

export function TableWithDeletableRows<T extends Array<any>>() {
    return GTableWithDeletableRows as new(props: GTableWithDeletableRows.Props<T>) => GTableWithDeletableRows<T>;
}
