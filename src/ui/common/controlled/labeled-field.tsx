/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ComboBox } from './combo-box';
import { LineEdit } from './line-edit';
import { TextArea } from './text-area';
import { TooltippedField } from '../tooltipped-field';

function CBCtor<T>() {
    return ComboBox as new(props: ComboBox.Props<T>) => ComboBox<T>;
}

function LECtor<T extends string>() {
    return LineEdit as new(props: LineEdit.Props<T>) => LineEdit<T>;
}

function TACtor<T extends string>() {
    return TextArea as new(props: TextArea.Props<T>) => TextArea<T>;
}

abstract class BaseLabeledField<P extends BaseLabeledField.Props> extends React.Component<P> {
    private renderLabel = (left: boolean) => {
        const cls = left ? 'form-field-label-left' : 'form-field-label';
        return (<label className={cls} htmlFor={`${this.props.id}`}>{this.props.label}</label>);
    }

    abstract renderWidget(): React.ReactFragment;

    render() {
        switch (this.props.style) {
        case 'above':
            return (
                <div>
                    <TooltippedField
                        position='above'
                        text={this.props.tooltip}
                        renderContent={() => this.renderLabel(false)} />
                    <div>
                        {this.renderWidget()}
                    </div>
                </div>
            );
        case 'left':
            return (
                <div className='form-field-left-container'>
                    <TooltippedField
                        position='left'
                        text={this.props.tooltip}
                        renderContent={() => this.renderLabel(true)} />
                    {this.renderWidget()}
                </div>
            );
        case 'left-grid':
            return (
                <>
                    <TooltippedField
                        position='left'
                        text={this.props.tooltip}
                        renderContent={() => this.renderLabel(true)} />
                    {this.renderWidget()}
                </>
            );
        }
    }
}

namespace BaseLabeledField {
    export interface Props {
        id: string;
        label: string;
        style: LabeledField.LabelPlacing;
        tooltip?: string;
    }
}

export namespace LabeledField {
    export type LabelPlacing = 'left' | 'above' | 'left-grid';

    export interface CBProps<T> extends BaseLabeledField.Props, ComboBox.Props<T> {
    }

    export interface LEProps<T> extends BaseLabeledField.Props, LineEdit.Props<T> {
    }

    export interface TAProps<T> extends BaseLabeledField.Props, TextArea.Props<T> {
    }

    export function ComboBox<T>() {
        return LabeledComboBox as new(props: CBProps<T>) => LabeledComboBox<T>;
    }

    export function LineEdit<T extends string>() {
        return LabeledLineEdit as new(props: LEProps<T>) => LabeledLineEdit<T>;
    }

    export function TextArea<T extends string>() {
        return LabeledTextArea as new(props: TAProps<T>) => LabeledTextArea<T>;
    }
}

export class LabeledComboBox<T> extends BaseLabeledField<LabeledField.CBProps<T>> {
    private Widget = CBCtor<T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledLineEdit<T extends string> extends BaseLabeledField<LabeledField.LEProps<T>> {
    private Widget = LECtor<T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledTextArea<T extends string> extends BaseLabeledField<LabeledField.TAProps<T>> {
    private Widget = TACtor<T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}