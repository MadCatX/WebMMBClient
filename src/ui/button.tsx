import * as React from 'react';

type ActionButtonProps = {
    label: string,
    onClick?: () => void,
}

export class ActionButton extends React.Component<ActionButtonProps> {
    state = {
        label: '',
        onClick: (): void => {},
    }

    render() {
        return (
            <button onClick={this.props.onClick}>{this.props.label}</button>
        )
    }
}
