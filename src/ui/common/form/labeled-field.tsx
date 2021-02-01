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
import { MultipleComboBox } from './multiple-combo-box';
import { TextArea } from './text-area';
import { LabeledFieldRenderer } from '../labeled-field-renderer';

export abstract class FBaseLabeledField<KE, KV extends string, T, U extends FormModel.V<T>, P extends FBaseLabeledField.Props<KE, KV, T>, S = {}> extends FormField<KE, KV, T, P, S> {
    abstract renderWidget(): React.ReactFragment;

    render() {
        return LabeledFieldRenderer.render(this.props, () => this.renderWidget())
    }
}

export namespace FBaseLabeledField {
    export interface Props<KE, KV extends string, T> extends FormField.Props<KE, KV, T>, LabeledFieldRenderer.Props {
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

    export interface MCBProps<KE, KV extends string, T, U extends T> extends
        FBaseLabeledField.Props<KE, KV, T>,
        MultipleComboBox.Props<KE, KV, T, U> {
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

    export function MultipleComboBox<KE, KV extends string, T, U extends T>() {
        return LabeledMultipleComboBox as new(props: MCBProps<KE, KV, T, U>) => LabeledMultipleComboBox<KE, KV, T, U>;
    }

    export function TextArea<KE, KV extends string, T>() {
        return LabeledTextArea as new(props: TAProps<KE, KV, T>) => LabeledTextArea<KE, KV, T>;
    }
}

export class LabeledCheckBox<KE, KV extends string, T, S = {}> extends FBaseLabeledField<KE, KV, T, T, LabeledField.CHProps<KE, KV, T>, S> {
    private Widget = CheckBox.Spec<KE, KV, T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledComboBox<KE, KV extends string, T, U extends FormModel.V<T>, S = {}> extends FBaseLabeledField<KE, KV, T, U, LabeledField.CBProps<KE, KV, T, U>, S> {
    private Widget = ComboBox.Spec<KE, KV, T, U>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledLineEdit<KE, KV extends string, T, S = {}> extends FBaseLabeledField<KE, KV, T, T, LabeledField.LEProps<KE, KV, T>, S> {
    private Widget = LineEdit.Spec<KE, KV, T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledMultipleComboBox<KE, KV extends string, T, U extends T, S = {}> extends FBaseLabeledField<KE, KV, T, U, LabeledField.MCBProps<KE, KV, T, U>, S> {
    private Widget = MultipleComboBox.Spec<KE, KV, T, U>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}

export class LabeledTextArea<KE, KV extends string, T, S = {}> extends FBaseLabeledField<KE, KV, T, T, LabeledField.TAProps<KE, KV, T>, S> {
    private Widget = TextArea.Spec<KE, KV, T>();

    renderWidget() {
        return (
            <this.Widget {...this.props} />
        );
    }
}