import * as React from 'react';
import { AbstractPushButton } from './push-button';

export class LinkButton extends AbstractPushButton<LinkButton.Props, {}> {
    private clsName() {
        if (this.props.url !== undefined)
            return this.props.className ?? 'pushbutton-default pushbutton-clr-default pushbutton-hclr-default';
        else
            return this.props.classNameDisabled ?? 'pushbutton-default pushbutton-clr-default-disabled';
    }

    private text() {
        if (this.props.url !== undefined) {
            return (
                <div
                    className='linkbutton-text'>{this.props.value}
                </div>
            );
        } else {
            return (<div className='pushbutton-text'>{this.props.value}</div>);
        }
    }

    renderButton() {
        return (
            <a
                id={this.props.id}
                className={this.clsName()}
                href={this.props.url}
                download={this.props.downloadAs} >
                {this.text()}
            </a>
        );
    }
}

export namespace LinkButton {
    export interface Props extends AbstractPushButton.Props {
        url?: string;
        downloadAs?: string;
    }
}