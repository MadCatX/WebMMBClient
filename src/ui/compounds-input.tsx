/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { MmbInputUtil as MmbUtil, MMBFU } from './mmb-input-form-util';
import { ErrorBox } from './common/error-box';
import { FormBlock } from './common/form-block';
import { LabeledField, GLabeledField } from './common/labeled-field';
import { PushButton } from './common/push-button';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { NtCConformation } from '../model/ntc-conformation';
import { Num } from '../util/num';

const AddedTable = MmbUtil.TWDR<Compound[]>();

const StrLabeledField = LabeledField<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.Values, string>();

export class CompoundsInput extends FormBlock<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.ValueTypes, CompoundsInput.Props> {
    constructor(props: CompoundsInput.Props) {
        super(props);

        this.compoundRemoved = this.compoundRemoved.bind(this);
    }

    private addSequence(data: MmbUtil.ContextData) {
        const chain = MMBFU.getScalar(data, 'mol-in-cp-chain-id', '');
        const firstResidueNo = Num.parseIntStrict(MMBFU.getScalar(data, 'mol-in-cp-first-res-no', ''));
        const type = MMBFU.getScalar<Compound.Type>(data, 'mol-in-cp-compound-type', 'RNA');

        const errors: string[] = [];
        if (chain.length !== 1)
            errors.push('Chain must be a single character string');
        if (isNaN(firstResidueNo))
            errors.push('First residue number value must be a number');

        try {
            const input = MMBFU.maybeGetScalar<string>(data, 'mol-in-cp-sequence');
            if (input === undefined)
                throw new Error('Sequence is empty');

            const sequence = Compound.stringToSequence(input);
            if (sequence.length < 1)
                throw new Error('Sequence is empty');

            const compounds = MMBFU.getArray<Compound[]>(data, 'mol-in-cp-added');
            compounds.forEach(c => {
                if (c.chain === chain)
                    throw new Error(`Compound with chain ${chain} is already present`);
            });

            if (errors.length === 0) {
                compounds.push(new Compound(chain, firstResidueNo, type, sequence));
                MMBFU.updateErrorsAndValues(
                    data,
                    [{ key: 'mol-in-cp-errors', errors }],
                    [{ key: 'mol-in-cp-added', value: compounds }],
                );
                return;
            }
        } catch (e) {
            errors.push(e.toString());
        }

        if (errors.length > 0)
            MMBFU.updateErrors(data, { key: 'mol-in-cp-errors', errors });
    }

    private compoundRemoved(c: Compound) {
        const chain = c.chain;

        let doubleHelices = MMBFU.getArray<DoubleHelix[]>(this.props.ctxData, 'mol-in-dh-added');
        doubleHelices = doubleHelices.filter(e => e.chainOne !== chain && e.chainTwo !== chain);

        let baseInteractions = MMBFU.getArray<BaseInteraction[]>(this.props.ctxData, 'mol-in-bi-added');
        baseInteractions = baseInteractions.filter(e => e.chainOne !== chain && e.chainTwo !== chain);

        let ntcs = MMBFU.getArray<NtCConformation[]>(this.props.ctxData, 'mol-in-ntcs-added');
        ntcs = ntcs.filter(e => e.chain !== chain);

        MMBFU.updateValues(
            this.props.ctxData,
            [
                { key: 'mol-in-dh-added', value: doubleHelices },
                { key: 'mol-in-bi-added', value: baseInteractions },
                { key: 'mol-in-ntcs-added', value: ntcs },
            ],
        );
    }

    render() {
        return (
            <div className='section'>
                <div className='section-caption'>Compound definiton</div>
                <div className='mol-in-cp-input spaced-grid'>
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-cp-chain-id', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label='Chain'
                        style='above'
                        inputType='line-edit'
                        options={[]} />
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-cp-first-res-no', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label='First residue no.'
                        style='above'
                        inputType='line-edit'
                        options={[]} />
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-cp-compound-type', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label='Type'
                        style='above'
                        inputType='combo-box'
                        options={
                            [
                                { value: 'RNA', caption: 'RNA' },
                                { value: 'DNA', caption: 'DNA' },
                            ]
                        } />
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-cp-sequence', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label='Sequence'
                        style='above'
                        inputType='text-area'
                        hint='Enter sequence'
                        spellcheck={false}
                        options={[]} />
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addSequence(this.props.ctxData);
                        }} />
                </div>
                <ErrorBox
                    errors={this.props.ctxData.errors.get('mol-in-cp-errors') ?? new Array<string>()} />
                <AddedTable
                    formId={this.props.formId}
                    className='mol-in-cp-added spaced-grid'
                    valuesKey='mol-in-cp-added'
                    deleter={this.compoundRemoved}
                    columns={[
                        { caption: 'Chain', k: 'chain' },
                        { caption: 'First residue no.', k: 'firstResidueNo' },
                        { caption: 'Type', k: 'type' },
                        { caption: 'Sequence', k: 'sequence' }]} />
            </div>
        );
    }
}

export namespace CompoundsInput {
    export interface Props extends FormBlock.Props<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.ValueTypes> {
    }
}
