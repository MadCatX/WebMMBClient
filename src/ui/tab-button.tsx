import * as React from 'react';
import { AbstractPushButton, PushButton } from './common/push-button';

interface State {
    isHighlighted: boolean;
}

export class TabButton extends AbstractPushButton<TabButton.Props, State> {
    constructor(props: TabButton.Props) {
        super(props);

        this.state = { isHighlighted: false };

        this.highlighted = this.highlighted.bind(this);
    }

    private highlighted(isHighlighted: boolean) {
        this.setState({
            ...this.state,
            isHighlighted,
        });
    }

    private lineClass() {
        if (this.props.isActive === false) {
            return this.state.isHighlighted ? 'tabbutton-line-inactive-highlighted' : 'tabbutton-line-inactive';
        }
        return 'tabbutton-line-active';
    }

    renderButton() {
        return (
            <div
                id={this.props.id}
                className={this.props.isActive ? 'tabbutton-active' : 'tabbutton-inactive'}
                onClick={this.props.onClick}
                onMouseEnter={() => this.highlighted(true)}
                onMouseLeave={() => this.highlighted(false)}>
                <div className='pushbutton-text'>{this.props.value}</div>
                <hr className={this.lineClass()} />
            </div>
        );
    }
}

export namespace TabButton {
    export interface Props extends PushButton.Props {
        isActive: boolean;
    }
}
