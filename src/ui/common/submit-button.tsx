import * as React from 'react';

export class SubmitButton extends React.Component<SubmitButton.Props> {
    static defaultProps = {
        enabled: true,
    }

    render() {
        return (
            <button
                type="submit"
                disabled={!this.props.enabled}>
                {this.props.label}
            </button>
        )
    }
}

export namespace SubmitButton {
    type Defaults = typeof SubmitButton.defaultProps;
    export interface Props extends Defaults {
        label: string;
        enabled: boolean;
    }
}
