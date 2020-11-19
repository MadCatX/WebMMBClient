/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

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

    private textClass() {
        if (this.props.isActive === false) {
            return this.state.isHighlighted ? 'tabbutton-text-inactive-highlighted' : 'tabbutton-text-inactive';
        }
        return 'tabbutton-text-active';
    }

    renderButton() {
        return (
            <div
                id={this.props.id}
                className={this.props.isActive ? 'tabbutton-active' : 'tabbutton-inactive'}
                onClick={this.props.onClick}
                onMouseEnter={() => this.highlighted(true)}
                onMouseLeave={() => this.highlighted(false)}>
                <div className={this.textClass()}>{this.props.value}</div>
            </div>
        );
    }
}

export namespace TabButton {
    export interface Props extends PushButton.Props {
        isActive: boolean;
    }
}
