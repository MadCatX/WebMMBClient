import * as React from 'react';

export abstract class AbstractPushButton<P extends AbstractPushButton.Props, S> extends React.Component<P, S> {
    abstract renderButton(): React.ReactFragment;

    render() {
        return (
            <>
                {this.renderButton()}
            </>
        );
    }
}

export class PushButton extends AbstractPushButton<PushButton.Props, {}> {
    renderButton() {
        return (
            <div
                id={this.props.id}
                className={this.props.className ?? 'pushbutton-default'}
                onClick={this.props.onClick}>
                <div className='pushbutton-text'>{this.props.value}</div>
            </div>
        );
    }
}

export namespace AbstractPushButton {
    export interface OnClick {
        (e: React.MouseEvent<HTMLInputElement>): void;
    }

    export interface Props {
        value: string;
        id?: string;
        className?: string
    }
}

export namespace PushButton {
    export interface OnClick {
        (e: React.MouseEvent<HTMLInputElement>): void;
    }

    export interface Props extends AbstractPushButton.Props {
        onClick: OnClick;
    }
}