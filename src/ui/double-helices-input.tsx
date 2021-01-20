/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { GComboBox } from './common/combo-box';
import { ErrorBox } from './common/error-box';
import { FormBlock } from './common/form-block';
import { LabeledField, GLabeledField } from './common/labeled-field';
import { PushButton } from './common/push-button';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { FormUtil } from '../model/common/form';
import { Num } from '../util/num';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<DoubleHelix[]>();
const NumLabeledField = LabeledField<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, number>();
const StrLabeledField = LabeledField<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, string>();

const VKeys: MIM.ValueKeys[] = [
    'mol-in-dh-chain-one',
    'mol-in-dh-first-res-no-one',
    'mol-in-dh-last-res-no-one',
    'mol-in-dh-chain-two',
    'mol-in-dh-first-res-no-two'
];

export class DoubleHelicesInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, DoubleHelicesInput.Props> {
    private addDoubleHelix(data: MIM.ContextData) {
        const chainOne = FU.maybeGetScalar<string>(data, 'mol-in-dh-chain-one');
        const firstResNoOne = FU.maybeGetScalar<number>(data, 'mol-in-dh-first-res-no-one');
        const lastResNoOne = FU.maybeGetScalar<number>(data, 'mol-in-dh-last-res-no-one');
        const chainTwo = FU.maybeGetScalar<string>(data, 'mol-in-dh-chain-two');
        const firstResNoTwo = FU.maybeGetScalar<number>(data, 'mol-in-dh-first-res-no-two');
        const lastResNoTwo = this.lastResNoTwo(firstResNoOne, lastResNoOne, firstResNoTwo);

        if (chainOne === undefined || firstResNoOne === undefined || lastResNoOne === undefined ||
            chainTwo === undefined || firstResNoTwo === undefined || lastResNoTwo === undefined)
            throw new Error('Incomplete double helix definition');

        // Sanity checks
        const errors: string[] = [];

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (MIM.getCompound(compounds, chainOne) === undefined || MIM.getCompound(compounds, chainTwo) === undefined)
            return; // Ignore if either of the compounds does not exist

        const [, lastAvail] = this.lastSelectableResidue(compounds, firstResNoOne, lastResNoOne, chainTwo);
        if (lastAvail === false)
            errors.push('No second residue');

        if (firstResNoOne > lastResNoOne)
            errors.push('Last residue number on the first chain cannot be smaller than first residue number');
        if (firstResNoTwo < lastResNoTwo)
            errors.push('Last residue number on the second chain cannot be greater than first residue number');
        if (lastResNoOne - firstResNoOne !== firstResNoTwo - lastResNoTwo)
            errors.push('Paried sections must have the same length');
        if (chainOne === chainTwo) {
            if (lastResNoOne >= lastResNoTwo)
                errors.push('Paired residues on the same chain cannot overlap');
        }

        if (errors.length > 0) {
            FU.updateErrors(this.props.ctxData, { key: 'mol-in-dh-errors', errors });
            return;
        }

        const dh = new DoubleHelix(chainOne, firstResNoOne, lastResNoOne, chainTwo, firstResNoTwo, lastResNoTwo);
        const value = FU.getArray<DoubleHelix[]>(data, 'mol-in-dh-added');

        if (value.find(e => e.equals(dh)) !== undefined) {
            errors.push('Such double helix already exists');
            FU.updateErrors(this.props.ctxData, { key: 'mol-in-dh-errors', errors });
            return;
        }

        value.push(dh);
        FU.updateErrorsAndValues(data, [{ key: 'mol-in-dh-errors', errors }], [{ key: 'mol-in-dh-added', value }]);
    }

    private clearAll() {
        this.props.ctxData.clearErrorsAndValues(['mol-in-dh-errors'], VKeys);
    }

    private lastResNoTwo(firstResNoOne?: number, lastResNoOne?: number, firstResNoTwo?: number) {
        if (firstResNoOne !== undefined && lastResNoOne !== undefined && firstResNoTwo !== undefined)
            return firstResNoTwo - (lastResNoOne - firstResNoOne);
        return undefined;
    }

    private lastSelectableResidue(compounds: Compound[], firstResNoOne?: number, lastResNoOne?: number, chainTwo?: string) : [number|undefined, boolean] {
        if (firstResNoOne === undefined || lastResNoOne === undefined || chainTwo === undefined)
            return [undefined, true];

        if (lastResNoOne < firstResNoOne)
            return [undefined, true];

        const comp = compounds.find((c) => c.chain === chainTwo);
        if (comp === undefined)
            return [undefined, true];
        const last = comp.firstResidueNo + (lastResNoOne - firstResNoOne);
        if (last > comp.lastResidueNo)
            return [undefined, false];
        return [last, true];
    }

    componentDidUpdate() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (compounds.length === 0) {
            this.clearAll();
            return;
        }

        const nv = FU.emptyValues();

        // First chain params
        let chainOne = FU.maybeGetScalar<string>(this.props.ctxData, 'mol-in-dh-chain-one');
        if (chainOne === undefined) {
            chainOne = compounds[0].chain;
            nv.set('mol-in-dh-chain-one', chainOne);
        }
        const c = MIM.getCompound(compounds, chainOne);
        if (c === undefined)
            return;

        const firstResNoOne = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-dh-first-res-no-one');
        const lastResNoOne = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-dh-last-res-no-one');
        if (firstResNoOne !== undefined && firstResNoOne <= c.lastResidueNo && firstResNoOne >= c.firstResidueNo) {
            if (lastResNoOne === undefined || lastResNoOne < firstResNoOne || lastResNoOne > c.lastResidueNo)
                nv.set('mol-in-dh-last-res-no-one', firstResNoOne);
        } else {
            const def = MIM.defaultFirstResNo(compounds, chainOne)!;
            nv.set('mol-in-dh-first-res-no-one', def);
            nv.set('mol-in-dh-last-res-no-one', def);
        }

        // Second chain params
        let chainTwo = FU.maybeGetScalar<string>(this.props.ctxData, 'mol-in-dh-chain-two');
        if (chainTwo === undefined) {
            chainTwo = compounds[0].chain;
            nv.set('mol-in-dh-chain-two', chainTwo);
        }
        const firstResNoTwo = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-dh-first-res-no-two');
        if (firstResNoTwo === undefined) {
            const def = MIM.defaultFirstResNoRev(compounds, chainTwo)!;
            nv.set('mol-in-dh-first-res-no-two', def);
        } else {
            const [lastSel, lastAvail] = this.lastSelectableResidue(compounds, firstResNoOne, lastResNoOne, chainTwo);
            const secondOpts: GComboBox.Option[] = lastAvail ? MIM.residueOptionsRev(compounds, chainTwo, undefined, lastSel) : [];
            if (secondOpts.length > 0) {
                const resno = parseInt(secondOpts[0].value);
                if (resno < firstResNoTwo)
                    nv.set('mol-in-dh-first-res-no-two', resno);
            }
        }

        if (nv.size > 0)
            this.props.ctxData.setValues(nv);
    }

    render() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const chainOne = FU.getScalar<string>(this.props.ctxData, 'mol-in-dh-chain-one', '');
        let   firstResNoOne = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-dh-first-res-no-one', MIM.defaultFirstResNo(compounds, chainOne));
        let   lastResNoOne = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-dh-last-res-no-one');
        const chainTwo = FU.getScalar<string>(this.props.ctxData, 'mol-in-dh-chain-two', '');

        if (chainOne !== '') {
            const c = MIM.getCompound(compounds, chainOne);
            if (c !== undefined) {
                /* Clamp first residue number to sensible values */
                if (Num.isNum(firstResNoOne)) {
                    if (firstResNoOne > c.lastResidueNo || firstResNoOne < c.firstResidueNo)
                        firstResNoOne = c.firstResidueNo;

                    /* Clamp last residue to sensible values */
                    if (Num.isNum(lastResNoOne)) {
                        if (lastResNoOne > c.lastResidueNo || lastResNoOne < firstResNoOne)
                            lastResNoOne = c.lastResidueNo;
                    }
                }
            }
        }

        let firstResNoTwo = FU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-dh-first-res-no-two', MIM.defaultFirstResNoRev(compounds, chainTwo));
        const [lastSel, lastAvail] = this.lastSelectableResidue(compounds, firstResNoOne, lastResNoOne, chainTwo);
        const secondOpts: GComboBox.Option[] = lastAvail ? MIM.residueOptionsRev(compounds, chainTwo, undefined, lastSel) : [];

        let lastResNoTwo = 'N/A';
        if (secondOpts.length > 0 && Num.isNum(firstResNoTwo)) {
            /* Mind the greatest -> smallest ordering */
            const lastAvail = parseInt(secondOpts[0].value);
            const firstAvail = parseInt(secondOpts[secondOpts.length-1].value);
            if (firstResNoTwo > lastAvail || firstResNoTwo < firstAvail)
                firstResNoTwo = lastAvail;
            lastResNoTwo = (this.lastResNoTwo(firstResNoOne, lastResNoOne, firstResNoTwo) ?? 'N/A').toString();
        }

        return (
            <div className='section'>
                <div className='section-caption'>Double helices</div>
                <div className='mol-in-dh-input spaced-grid'>
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-dh-chain-one', this.props.formId, ['labeled-field'])}
                        label='Chain'
                        style='above'
                        inputType='combo-box'
                        options={MIM.chainOptions(this.props.ctxData)}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-dh-first-res-no-one', this.props.formId, ['labeled-field'])}
                        label='First residue'
                        style='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={MIM.residueOptions(compounds, chainOne)}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-dh-last-res-no-one', this.props.formId, ['labeled-field'])}
                        label='Last residue'
                        style='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={MIM.residueOptions(compounds, chainOne, firstResNoOne)}
                        ctxData={this.props.ctxData} />
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-dh-chain-two', this.props.formId, ['labeled-field'])}
                        label='Chain'
                        style='above'
                        inputType='combo-box'
                        options={MIM.chainOptions(this.props.ctxData)}
                        ctxData={this.props.ctxData} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-dh-first-res-no-two', this.props.formId, ['labeled-field'])}
                        label='First residue'
                        style='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={secondOpts}
                        ctxData={this.props.ctxData} />
                    <div>
                        <div>Last residue</div>
                        <div>{lastResNoTwo}</div>
                    </div>
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addDoubleHelix(this.props.ctxData);
                        }} />
                </div>
                <ErrorBox
                    errors={this.props.ctxData.errors.get('mol-in-dh-errors') ?? new Array<string>()} />
                <AddedTable
                    formId={this.props.formId}
                    className='mol-in-dh-added spaced-grid'
                    valuesKey='mol-in-dh-added'
                    columns={[
                        {caption: 'Chain', k: 'chainOne'},
                        {caption: 'First residue', k: 'firstResidueNoOne'},
                        {caption: 'Last residue', k: 'lastResidueNoOne'},
                        {caption: 'Chain', k: 'chainTwo'},
                        {caption: 'First residue', k: 'firstResidueNoTwo'},
                        {caption: 'Last residue', k: 'lastResidueNoTwo'}]}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace DoubleHelicesInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}
