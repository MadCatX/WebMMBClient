import * as React from 'react';
import { FormUtil } from './form';
import { FormField } from './form-field';
import { CheckBox, GCheckBox } from './check-box';
import { ComboBox, GComboBox } from './combo-box';
import { LineEdit, GLineEdit } from './line-edit';
import { TextArea, GTextArea } from './text-area';
import { TooltippedField } from './tooltipped-field';

export class GLabeledField<KE, KV extends string, T, U extends FormUtil.V<T>> extends FormField<KE, KV, T, GLabeledField.Props<KV, T, U>> {
    /*static defaultProps = {
        ...GLineEdit.defaultProps,
        //  ...GTextArea.defaultProps,
    }*/ // Revisit this later

    private CheckBox = CheckBox<KE, KV, T>();
    private ComboBox = ComboBox<KE, KV, T, U>();
    private LineEdit = LineEdit<KE, KV, T>();
    private TextArea = TextArea<KE, KV, T>();

    constructor(props: GLabeledField.Props<KV, T, U>) {
        super(props);

        this.renderLabel = this.renderLabel.bind(this);
    }

    private inputField(pos: GLabeledField.LabelPosition) {
        const cname = (pos === 'above') ? 'form-field-input-above' : 'form-field-input-left';

        switch (this.props.inputType) {
        case 'check-box':
            return (<this.CheckBox {...this.props} className={cname} />);
        case 'combo-box':
            return (<this.ComboBox {...this.props} className={cname} />);
        case 'line-edit':
            return (<this.LineEdit {...this.props} className={cname} />);
        case 'text-area':
            return (<this.TextArea {...this.props} className={cname} />);
        }
    }

    private renderLabel() {
        return (<label className='form-field-label' htmlFor={`${this.props.id}`}>{this.props.label}</label>);
    }

    render() {
        switch (this.props.position) {
        case 'above':
            return (
                <div className={this.props.className}>
                    <TooltippedField
                        position='left'
                        text={this.props.tooltip}
                        renderContent={this.renderLabel} />
                    <div>
                        {this.inputField(this.props.position)}
                    </div>
                </div>
            );
        case 'left':
            return (
                <>
                    <TooltippedField
                        position='left'
                        text={this.props.tooltip}
                        renderContent={this.renderLabel} />
                    {this.inputField(this.props.position)}
                </>
            );
        }
    }
}

export namespace GLabeledField {
    export type LabelPosition = 'left' | 'above';
    export type InputType = 'line-edit' | 'combo-box' | 'text-area' | 'check-box';

    export interface Props<KV extends string, T, U extends FormUtil.V<T>> extends
                                       GLineEdit.Props<KV>,
                                       GComboBox.Props<KV, T, U>,
                                       GTextArea.Props<KV>,
                                       GCheckBox.Props<KV> {
        label: string;
        position: LabelPosition;
        inputType: InputType;
        className?: string;
        tooltip?: string;
    }

    export function tags<KV extends string>(base: KV, suffix: string, cn?: string[]) {
        return {
            id: `${base}-${suffix}`,
            className: cn ? cn.reduce((a, b) => `${a} ${b}`) : base,
            keyId: base,
        };
    }
}

export function LabeledField<KE, KV extends string, T, U extends FormUtil.V<T>>() {
    return GLabeledField as new(props: GLabeledField.Props<KV, T, U>) => GLabeledField<KE, KV, T, U>;
}

export function LabeledCheckBox<KE, KV extends string, T>() {
    return GLabeledField as new(props: GLabeledField.Props<KV, T, boolean>) => GLabeledField<KE, KV, T, boolean>;
}