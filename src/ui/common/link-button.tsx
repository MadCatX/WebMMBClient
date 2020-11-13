import * as React from 'react';
import { AbstractPushButton } from './push-button';

export class LinkButton extends AbstractPushButton<LinkButton.Props, {}> {
    renderButton() {
        return (
            <div
                id={this.props.id}
                className={this.props.className ?? 'pushbutton-default'} >
                <a
                    className='linkbutton-text'
                    href={this.props.url}
                    download={this.props.downloadAs} >{this.props.value}</a>
            </div>
        );
    }
}

export namespace LinkButton {
    export interface Props extends AbstractPushButton.Props {
        url: string;
        downloadAs?: string;
    }
}