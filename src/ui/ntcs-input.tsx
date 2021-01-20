/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ErrorBox } from './common/error-box';
import { LabeledField, GLabeledField } from './common/labeled-field';
import { PushButton } from './common/push-button';
import { Compound } from '../model/compound';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { NtC } from '../model/ntc';
import { NtCConformation } from '../model/ntc-conformation';
import { FormUtil } from '../model/common/form';
import { GComboBox } from './common/combo-box';
import { FormBlock } from './common/form-block';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<NtCConformation[]>();
const StrLabeledField = LabeledField<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, string>();
const NumLabeledField = LabeledField<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, number>();
const NtCLabeledField = LabeledField<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, NtC.Conformer>();

const VKeys: MIM.ValueKeys[] = [
    'mol-in-ntcs-chain',
    'mol-in-ntcs-first-res-no',
    'mol-in-ntcs-last-res-no',
    'mol-in-ntcs-ntc'
];

export class NtCsInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, NtCsInput.Props> {
    private addNtC(data: MIM.ContextData) {
        const chain = FU.maybeGetScalar<string>(data, 'mol-in-ntcs-chain');
        const firstResNo = FU.maybeGetScalar<number>(data, 'mol-in-ntcs-first-res-no');
        const lastResNo = FU.maybeGetScalar<number>(data, 'mol-in-ntcs-last-res-no');
        const cfrm = FU.maybeGetScalar<NtC.Conformer>(data, 'mol-in-ntcs-ntc');

        if (chain === undefined || firstResNo === undefined || lastResNo === undefined || cfrm === undefined)
            return;

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (MIM.getCompound(compounds, chain) === undefined)
            return; // Ignore if either of the compounds does not exist

        const ntc = new NtCConformation(chain, firstResNo, lastResNo, cfrm);
        const ntcs = FU.getArray<NtCConformation[]>(data, 'mol-in-ntcs-added');

        if (isNaN(firstResNo) || isNaN(lastResNo)) {
            FU.updateErrors(this.props.ctxData, { key: 'mol-in-ntcs-errors', errors: [ 'Invalid residue numbers' ] });
            return;
        }
        if (lastResNo <= firstResNo) {
            FU.updateErrors(this.props.ctxData, { key: 'mol-in-ntcs-errors', errors: [ 'Invalid last residue number' ] });
            return;
        }
        if (ntcs.find((e) => e.equals(ntc)) !== undefined) {
            FU.updateErrors(this.props.ctxData, { key: 'mol-in-ntcs-errors', errors: [ 'Such NtC configuration already exists' ] });
            return;
        }

        ntcs.push(new NtCConformation(chain, firstResNo, lastResNo, cfrm));
        FU.updateErrorsAndValues(data, [{ key: 'mol-in-ntcs-errors', errors: [] }], [{ key: 'mol-in-ntcs-added', value: ntcs }]);
    }

    private clearAll() {
        this.props.ctxData.clearErrorsAndValues(['mol-in-ntcs-errors'], VKeys);
    }

    componentDidUpdate() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (compounds.length === 0) {
            this.clearAll();
            return;
        }

        const nv = FU.emptyValues();

        let chain = FU.maybeGetScalar<string>(this.props.ctxData, 'mol-in-ntcs-chain');
        if (chain === undefined) {
            chain = compounds[0].chain;
            nv.set('mol-in-ntcs-chain', chain);
        }
        const c = MIM.getCompound(compounds, chain);
        if (c === undefined || c.residueCount < 2) {
            const firstResNo = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-first-res-no') ?? NaN;
            const lastResNo = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-last-res-no') ?? NaN;
            if (isNaN(firstResNo) && isNaN(lastResNo))
                return;
            nv.set('mol-in-ntcs-first-res-no', NaN);
            nv.set('mol-in-ntcs-last-res-no', NaN);
            this.props.ctxData.setValues(nv);
            return;
        }

        const firstResNo = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-first-res-no') ?? NaN;
        const lastResNo = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-last-res-no') ?? NaN;
        if (!isNaN(firstResNo) && firstResNo >= c.firstResidueNo && firstResNo <= c.lastResidueNo) {
            if (isNaN(lastResNo) || lastResNo <= firstResNo || lastResNo > c.lastResidueNo)
                nv.set('mol-in-ntcs-last-res-no', firstResNo + 1);
        } else {
            const def = MIM.defaultFirstResNo(compounds, chain)!;
            nv.set('mol-in-ntcs-first-res-no', def);
            nv.set('mol-in-ntcs-last-res-no', def + 1);
        }

        if (FU.maybeGetScalar<NtC.Conformer>(this.props.ctxData, 'mol-in-ntcs-ntc') === undefined)
            nv.set('mol-in-ntcs-ntc', MIM.AllNtCsOptions[0].value);

        if (nv.size > 0)
            this.props.ctxData.setValues(nv);
    }

    render() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const chain = FU.maybeGetScalar<string>(this.props.ctxData, 'mol-in-ntcs-chain');

        let firstResOpts: GComboBox.Option[] = [];
        let lastResOpts: GComboBox.Option[] = [];
        if (chain !== undefined) {
            const c = MIM.getCompound(compounds, chain);

            if (c !== undefined && c.residueCount > 1) {
                firstResOpts = MIM.residueOptions(compounds, chain, c.firstResidueNo, c.lastResidueNo - 1);
                const firstResNo = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-first-res-no') ?? NaN;
                if (!isNaN(firstResNo) && firstResNo >= c.firstResidueNo && firstResNo <= c.lastResidueNo)
                    lastResOpts = MIM.residueOptions(compounds, chain, firstResNo + 1);
                else
                    lastResOpts = MIM.residueOptions(compounds, chain, c.firstResidueNo + 1);
            }
        }

        return (
            <div className='section'>
                <div className='section-caption'>NtCs</div>
                <div className='mol-in-ntcs-input spaced-grid'>
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-ntcs-chain', this.props.formId, ['labeled-field'])}
                        label='Chain'
                        style='above'
                        inputType='combo-box'
                        options={MIM.chainOptions(this.props.ctxData)}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-ntcs-first-res-no', this.props.formId, ['labeled-field'])}
                        label='First residue'
                        style='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={firstResOpts}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-ntcs-last-res-no', this.props.formId, ['labeled-field'])}
                        label="Last residue"
                        style='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={lastResOpts}
                        ctxData={this.props.ctxData} />
                    <NtCLabeledField
                        {...GLabeledField.tags('mol-in-ntcs-ntc', this.props.formId, ['labeled-field'])}
                        label='NtC'
                        style='above'
                        inputType='combo-box'
                        options={MIM.AllNtCsOptions}
                        ctxData={this.props.ctxData} />
                    <PushButton
                        className="pushbutton-common pushbutton-add"
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addNtC(this.props.ctxData);
                        }} />
                </div>
                <ErrorBox
                    errors={this.props.ctxData.errors.get('mol-in-ntcs-errors') ?? new Array<string>()} />
                <AddedTable
                    formId={this.props.formId}
                    className='mol-in-ntcs-added spaced-grid'
                    valuesKey='mol-in-ntcs-added'
                    columns={[
                        {caption: 'Chain', k: 'chain'},
                        {caption: 'First residue', k: 'firstResidueNo'},
                        {caption: 'Last residue', k: 'lastResidueNo'},
                        {caption: 'NtC', k: 'ntc'}]}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace NtCsInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}
