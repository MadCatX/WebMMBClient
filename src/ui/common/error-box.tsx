/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';

export class ErrorBox extends React.Component<ErrorBox.Props> {
    render() {
        return (
            <div className="error-box">
                {this.props.errors.map((err, n) => (<div key={`err-${n}`} className='error-message'>{err}</div>))}
            </div>
        );
    }
}

export namespace ErrorBox {
    export interface Props {
        errors: string[];
    }
}
