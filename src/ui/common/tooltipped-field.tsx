/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';

export class TooltippedField extends React.Component<TooltippedField.Props> {
    private renderTooltip() {
        if (this.props.text === undefined)
            return undefined;

        const cls = `tooltip-common tooltip-${this.props.position}`;
        return (<div className={cls}><div className='tooltip-inner'>{this.props.text}</div></div>);
    }

    render() {
        switch (this.props.style) {
        case 'entire-label':
            return (
                <div className='tooltip-container tooltip-container-entire-label'>
                    {this.renderTooltip()}
                    {this.props.renderContent()}
                </div>
            );
        case 'question-mark':
            return (
                <>
                    {this.props.renderContent()}
                    <div className='tooltip-container tooltip-container-question-mark'>
                        <div className='tooltip-container-question-mark-text-common tooltip-container-question-mark-text'>[?]</div>
                        {this.renderTooltip()}
                    </div>
                </>
            );
        }
    }
}

export namespace TooltippedField {
    export type Position = 'above' | 'below' | 'left' | 'right';
    export type Style = 'entire-label' | 'question-mark';

    export interface ContentRenderer {
        (): React.ReactFragment;
    }

    export interface Props {
        position: Position;
        style: Style;
        renderContent: ContentRenderer;
        text?: string;
    }
}
