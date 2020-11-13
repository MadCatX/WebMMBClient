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

//TODO: Remove the generics altogether
