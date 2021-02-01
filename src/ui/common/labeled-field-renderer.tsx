/**
 * Copyright (c) 2020-2021 Linkers contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react'
import { TooltippedField } from './tooltipped-field';

export namespace LabeledFieldRenderer {
    export interface WidgetRenderer {
        (): React.ReactFragment;
    }

    function renderLabel<P extends Props>(props: P, left: boolean) {
        const cls = left ? 'form-field-label-left' : 'form-field-label';
        return (<label className={cls} htmlFor={`${props.id}`}>{props.label}</label>);
    }

    export function render<P extends Props>(props: P, widgetRenderer: WidgetRenderer) {
        switch (props.style) {
        case 'above':
            return (
                <div className={props.containerClass}>
                    <div className='form-field-label-container'>
                        <TooltippedField
                            position={props.tooltipPosition ?? 'above'}
                            style={props.tooltipStyle ?? 'entire-label'}
                            text={props.tooltip}
                            renderContent={() => renderLabel(props, false)} />
                    </div>
                    <div>
                        {widgetRenderer()}
                    </div>
                </div>
            );
        case 'left':
            return (
                <div className={props.containerClass ?? 'form-field-left-container'}>
                    <div className='form-field-label-container'>
                        <TooltippedField
                            position={props.tooltipPosition ?? 'left'}
                            style={props.tooltipStyle ?? 'entire-label'}
                            text={props.tooltip}
                            renderContent={() => renderLabel(props, true)} />
                    </div>
                    {widgetRenderer()}
                </div>
            );
        case 'left-grid':
            if (props.containerClass)
                    console.warn('containerClass property is not used by "left-grid" placing style');
            return (
                <>
                    <div className='form-field-label-container'>
                        <TooltippedField
                            position={props.tooltipPosition ?? 'left'}
                            style={props.tooltipStyle ?? 'entire-label'}
                            text={props.tooltip}
                            renderContent={() => renderLabel(props, true)} />
                    </div>
                    {widgetRenderer()}
                </>
            );
        }
    }

    export type LabelPlacing = 'left' | 'above' | 'left-grid';

    export interface Props {
        id: string;
        label: string;
        style: LabelPlacing;
        containerClass?: string;
        tooltip?: string;
        tooltipPosition?: TooltippedField.Position;
        tooltipStyle?: TooltippedField.Style;
    }
}
