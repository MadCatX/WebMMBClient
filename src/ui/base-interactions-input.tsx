/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormContextManager as FCM } from './form-context-manager';
import { MmbInputUtil as MmbUtil, MMBFU } from './mmb-input-form-util';
import { GComboBox } from './common/combo-box';
import { ErrorBox } from './common/error-box';
import { FormBlock } from './common/form-block';
import { LabeledField, GLabeledField } from './common/labeled-field';
import { PushButton } from './common/push-button';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { EdgeInteraction } from '../model/edge-interaction';
import { Orientation } from '../model/orientation';

const EdgeOptions = EdgeInteraction.Edges.map((e) => {
    const o: GComboBox.Option = {value: e, caption: EdgeInteraction.toString(e)};
    return o;
});
const OrientationOptions = Orientation.Orientations.map((v) => {
    const o: GComboBox.Option = {value: v, caption: v};
    return o;
});

const AddedTable = MmbUtil.TWDR<BaseInteraction[]>();

const NumLabeledField = LabeledField<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.Values, number>();
const EdgeLabeledField = LabeledField<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.Values, EdgeInteraction.Edge>();
const OrientLabeledField = LabeledField<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.Values, Orientation.Orientation>();

const VKeys: MmbUtil.ValueKeys[] = [
    'mol-in-bi-chain-one',
    'mol-in-bi-res-no-one',
    'mol-in-bi-edge-one',
    'mol-in-bi-chain-two',
    'mol-in-bi-res-no-two',
    'mol-in-bi-edge-two',
    'mol-in-bi-orientation',
];

class BaseInteractionsInputInner extends FormBlock<BaseInteractionsInputInner.Props> {
    private addBaseInteraction(data: MmbUtil.ContextData) {
        const chainOne = MMBFU.maybeGetScalar<string>(data, 'mol-in-bi-chain-one');
        const residueOne = MMBFU.maybeGetScalar<number>(data, 'mol-in-bi-res-no-one');
        const edgeOne = MMBFU.maybeGetScalar<EdgeInteraction.Edge>(data, 'mol-in-bi-edge-one');
        const chainTwo = MMBFU.maybeGetScalar<string>(data, 'mol-in-bi-chain-two');
        const residueTwo = MMBFU.maybeGetScalar<number>(data, 'mol-in-bi-res-no-two');
        const edgeTwo = MMBFU.maybeGetScalar<EdgeInteraction.Edge>(data, 'mol-in-bi-edge-two');
        const orientation = MMBFU.maybeGetScalar<Orientation.Orientation>(data, 'mol-in-bi-orientation');

        if (chainOne === undefined || residueOne === undefined || edgeOne === undefined ||
            chainTwo === undefined || residueTwo === undefined || edgeTwo === undefined ||
            orientation === undefined)
            throw new Error('Incomplete base interaction definition');

        // Sanity checks
        const errors: string[] = [];
        const compounds = MMBFU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (MmbUtil.getCompound(compounds, chainOne) === undefined || MmbUtil.getCompound(compounds, chainTwo) === undefined)
            return; // Ignore if either of the compounds does not exist

        if (residueOne === residueTwo && chainOne === chainTwo)
            errors.push('Residue cannot interact with itself');

        if (errors.length > 0) {
            MMBFU.updateErrors(this.props.ctxData, { key: 'mol-in-bi-errors', errors });
            return;
        }

        const value = MMBFU.getArray<BaseInteraction[]>(data, 'mol-in-bi-added');
        const bi = new BaseInteraction(chainOne, residueOne, edgeOne, chainTwo, residueTwo, edgeTwo, orientation);

        if (value.find(e => e.equals(bi)) !== undefined) {
            errors.push('Such base interaction already exists');
            MMBFU.updateErrors(this.props.ctxData, { key: 'mol-in-bi-errors', errors });
            return;
        }

        value.push(bi);
        MMBFU.updateErrorsAndValues(data, [{ key: 'mol-in-bi-errors', errors }], [{ key: 'mol-in-bi-added', value }]);
    }

    private clearAll() {
        this.props.ctxData.clearErrorsAndValues(['mol-in-bi-errors'], VKeys);
    }

    componentDidUpdate() {
        const compounds = MMBFU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (compounds.length === 0) {
            this.clearAll();
            return;
        }

        const nv = MMBFU.emptyValues();

        // First chain params
        let chainOne = MMBFU.maybeGetScalar<string>(this.props.ctxData, 'mol-in-bi-chain-one');
        if (chainOne === undefined) {
            chainOne = compounds[0].chain;
            nv.set('mol-in-bi-chain-one', chainOne);
        }
        const resNoOne = MMBFU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-bi-res-no-one');
        if (resNoOne === undefined)
            nv.set('mol-in-bi-res-no-one', MmbUtil.defaultFirstResNo(compounds, chainOne)!);
        const edgeOne = MMBFU.maybeGetScalar<EdgeInteraction.Edge>(this.props.ctxData, 'mol-in-bi-edge-one');
        if (edgeOne === undefined)
            nv.set('mol-in-bi-edge-one', EdgeOptions[0].value);

        // Second chain params
        let chainTwo = MMBFU.maybeGetScalar<string>(this.props.ctxData, 'mol-in-bi-chain-two');
        if (chainTwo === undefined) {
            chainTwo = compounds[0].chain;
            nv.set('mol-in-bi-chain-two', chainTwo);
        }
        const resNoTwo = MMBFU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-bi-res-no-two');
        if (resNoTwo === undefined)
            nv.set('mol-in-bi-res-no-two', MmbUtil.defaultFirstResNo(compounds, chainTwo)!);
        const edgeTwo = MMBFU.maybeGetScalar<EdgeInteraction.Edge>(this.props.ctxData, 'mol-in-bi-edge-two');
        if (edgeTwo === undefined)
            nv.set('mol-in-bi-edge-two', EdgeOptions[0].value);

        if (MMBFU.maybeGetScalar<Orientation.Orientation>(this.props.ctxData, 'mol-in-bi-orientation') === undefined)
            nv.set('mol-in-bi-orientation', OrientationOptions[0].value);

        if (nv.size > 0)
            this.props.ctxData.setValues(nv);
    }

    render() {
        const compounds = MMBFU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const chainOne = MMBFU.getScalar(this.props.ctxData, 'mol-in-bi-chain-one', '');
        const chainTwo = MMBFU.getScalar(this.props.ctxData, 'mol-in-bi-chain-two', '');

        return (
            <div className='section'>
                <div className='section-caption'>Base interactions</div>
                <div className='mol-in-bi-input spaced-grid'>
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-bi-chain-one', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label="Chain"
                        style='above'
                        inputType='combo-box'
                        options={MmbUtil.chainOptions(this.props.ctxData)} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-bi-res-no-one', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label="Residue"
                        style='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={MmbUtil.residueOptions(compounds, chainOne)} />
                    <EdgeLabeledField
                        {...GLabeledField.tags('mol-in-bi-edge-one', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label="Edge"
                        style='above'
                        inputType='combo-box'
                        options={EdgeOptions} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-bi-chain-two', this.props.formId, ['labeled-field'])}
                        label="Chain"
                        formId={this.props.formId}
                        style='above'
                        inputType='combo-box'
                        options={MmbUtil.chainOptions(this.props.ctxData)} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-bi-res-no-two', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label="Residue"
                        style='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={MmbUtil.residueOptions(compounds, chainTwo)} />
                    <EdgeLabeledField
                        {...GLabeledField.tags('mol-in-bi-edge-two', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label="Edge"
                        style='above'
                        inputType='combo-box'
                        options={EdgeOptions} />
                    <OrientLabeledField
                        {...GLabeledField.tags('mol-in-bi-orientation', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label="Orientation"
                        style='above'
                        inputType='combo-box'
                        options={OrientationOptions} />
                    <PushButton
                        className="pushbutton-common pushbutton-add"
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addBaseInteraction(this.props.ctxData);
                        }} />
                </div>
                <ErrorBox
                    errors={this.props.ctxData.errors.get('mol-in-bi-errors') ?? new Array<string>()} />
                <AddedTable
                    formId={this.props.formId}
                    className='mol-in-bi-added spaced-grid'
                    valuesKey='mol-in-bi-added'
                    columns={[
                        {caption: 'Chain', k: 'chainOne'},
                        {caption: 'Residue', k: 'residueOne'},
                        {caption: 'Edge', k: 'edgeOne'},
                        {caption: 'Chain', k: 'chainTwo'},
                        {caption: 'Residue', k: 'residueTwo'},
                        {caption: 'Edge', k: 'edgeTwo'},
                        {caption: 'Orientation', k: 'orientation'}]} />
            </div>
        );
    }
}

namespace BaseInteractionsInputInner {
    export interface Props extends FormBlock.Props {
        ctxData: MmbUtil.ContextData;
    }
}

export class BaseInteractionsInput extends FormBlock<BaseInteractionsInput.Props> {
    render() {
        const CC = FCM.getContext(this.props.formId).Consumer;

        return (
            <CC>
                {(data: MmbUtil.ContextData) =>
                    <BaseInteractionsInputInner {...this.props} ctxData={data} />
                }
            </CC>
        );
    }
}

export namespace BaseInteractionsInput {
    export interface Props extends FormBlock.Props {
    }
}