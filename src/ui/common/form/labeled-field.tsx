/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormModel } from '../../../model/common/form';
import { FormField } from './form-field';
import { CheckBox } from './check-box';
import { ComboBox } from './combo-box';
import { LineEdit } from './line-edit';
import { TextArea } from './text-area';
import { TooltippedField } from '../tooltipped-field';

abstract class FBaseLabeledField<KE, KV extends string, T, U extends FormModel.V<T>, P extends FBaseLabeledField.Props<KE, KV, T>> extends FormField<KE, KV, T, P> {
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

namespace FBaseLabeledField {
    export interface Props<KE, KV extends string, T> extends FormField.Props<KE, KV, T> {
        label: string;
        style: LabeledField.LabelPlacing;
        tooltip?: string;
    }
}

export namespace LabeledField {
    export type LabelPlacing = 'left' | 'above' | 'left-grid';

    export interface CHProps<KE, KV extends string, T> extends
        FBaseLabeledField.Props<KE, KV, T>,
        CheckBox.Props<KE, KV, T> {
    }

    export interface CBProps<KE, KV extends string, T, U extends FormModel.V<T>> extends
        FBaseLabeledField.Props<KE, KV, T>,
        ComboBox.Props<KE, KV, T, U> {
    }

    export interface LEProps<KE, KV extends string, T> extends
        FBaseLabeledField.Props<KE, KV, T>,
        LineEdit.Props<KE, KV, T> {
    }

    export interface TAProps<KE, KV extends string, T> extends
        FBaseLabeledField.Props<KE, KV, T>,
        TextArea.Props<KE, KV, T> {
    }

    export function CheckBox<KE, KV extends string, T>() {
        return LabeledCheckBox as new(props: CHProps<KE, KV, T>) => LabeledCheckBox<KE, KV, T>;
    }

    export function ComboBox<KE, KV extends string, T, U extends FormModel.V<T>>() {
        return LabeledComboBox as new(props: CBProps<KE, KV, T, U>) => LabeledComboBox<KE, KV, T, U>;
    }

    export function LineEdit<KE, KV extends string, T>() {
        return LabeledLineEdit as new(props: LEProps<KE, KV, T>) => LabeledLineEdit<KE, KV, T>;
    }

    export function TextArea<KE, KV extends string, T>() {
        return LabeledTextArea as new(props: TAProps<KE, KV, T>) => LabeledTextArea<KE, KV, T>;
    }
}

export class LabeledCheckBox<KE, KV extends string, T> extends FBaseLabeledField<KE, KV, T, T, LabeledField.CHProps<KE, KV, T>> {
    private Widget = CheckBox.Spec<KE, KV, T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledComboBox<KE, KV extends string, T, U extends FormModel.V<T>> extends FBaseLabeledField<KE, KV, T, U, LabeledField.CBProps<KE, KV, T, U>> {
    private Widget = ComboBox.Spec<KE, KV, T, U>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledLineEdit<KE, KV extends string, T> extends FBaseLabeledField<KE, KV, T, T, LabeledField.LEProps<KE, KV, T>> {
    private Widget = LineEdit.Spec<KE, KV, T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledTextArea<KE, KV extends string, T> extends FBaseLabeledField<KE, KV, T, T, LabeledField.TAProps<KE, KV, T>> {
    private Widget = TextArea.Spec<KE, KV, T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}