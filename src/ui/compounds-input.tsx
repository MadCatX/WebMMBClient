/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ErrorBox } from './common/error-box';
import { FormBlock } from './common/form/form-block';
import { PushButton } from './common/push-button';
import { LabeledField } from './common/controlled/labeled-field';
import { FormUtil } from '../model/common/form';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { Mobilizer } from '../model/mobilizer';
import { NtCConformation } from '../model/ntc-conformation';
import { Num } from '../util/num';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<Compound[]>();
const CpTypeLField = LabeledField.ComboBox<Compound.Type>();
const StrLField = LabeledField.LineEdit<string>();
const SeqLField = LabeledField.TextArea<string>();

function isSequenceValid(type: Compound.Type, input: string) {
    try {
        const seq = Compound.stringToSequence(input);
        switch (type) {
        case 'DNA':
            return Compound.isDna(seq);
        case 'RNA':
            return Compound.isRna(seq);
        }
    } catch (e) {
        return false;
    }
}

interface State {
    chain: string;
    firstResidueNo: string;
    compoundType: Compound.Type;
    sequence: string;
    errors: string[];
}

export class CompoundsInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, CompoundsInput.Props, State> {
    constructor(props: CompoundsInput.Props) {
        super(props);

        this.state = {
            chain: '',
            firstResidueNo: '1',
            compoundType: 'RNA',
            sequence: '',
            errors: new Array<string>(),
        };
    }

    private addSequence(data: MIM.ContextData) {
        const errors = new Array<string>();
        if (this.state.chain.length !== 1)
            errors.push('Chain must be a single character string');
        const resNo = Num.parseIntStrict(this.state.firstResidueNo);
        if (isNaN(resNo))
            errors.push('First residue number value must be a number');

        if (this.state.sequence.length < 1)
            errors.push('Sequence is empty');
        else if (!isSequenceValid(this.state.compoundType, this.state.sequence))
            errors.push('Sequence is invalid');

        if (errors.length > 0) {
            this.setState({ ...this.state, errors });
            return;
        }

        const compounds = FU.getArray<Compound[]>(data, 'mol-in-cp-added');
        for (let idx = 0; idx < compounds.length; idx++) {
            if (compounds[idx].chain === this.state.chain) {
                errors.push(`Compound with chain ${this.state.chain} is already present`);
                this.setState({ ...this.state, errors });
                return;
            }
        }

        compounds.push(new Compound(this.state.chain, resNo, this.state.compoundType, Compound.stringToSequence(this.state.sequence)));
        this.setState({ ...this.state, errors: [] });
        FU.updateValues(data, [{ key: 'mol-in-cp-added', value: compounds }]);
    }

    private compoundRemoved = (c: Compound) => {
        const chain = c.chain;

        let doubleHelices = FU.getArray<DoubleHelix[]>(this.props.ctxData, 'mol-in-dh-added');
        doubleHelices = doubleHelices.filter(e => e.chainOne !== chain && e.chainTwo !== chain);

        let baseInteractions = FU.getArray<BaseInteraction[]>(this.props.ctxData, 'mol-in-bi-added');
        baseInteractions = baseInteractions.filter(e => e.chainOne !== chain && e.chainTwo !== chain);

        let ntcs = FU.getArray<NtCConformation[]>(this.props.ctxData, 'mol-in-ntcs-added');
        ntcs = ntcs.filter(e => e.chain !== chain);

        let mobilizers = FU.getArray<Mobilizer[]>(this.props.ctxData, 'mol-in-mobilizers-added');
        mobilizers = mobilizers.filter(e => e.chain !== chain);

        FU.updateValues(
            this.props.ctxData,
            [
                { key: 'mol-in-dh-added', value: doubleHelices },
                { key: 'mol-in-bi-added', value: baseInteractions },
                { key: 'mol-in-ntcs-added', value: ntcs },
                { key: 'mol-in-mobilizers-added', value: mobilizers },
            ],
        );
    }

    render() {
        return (
            <div className='section'>
                <div className='section-caption'>Compound definition</div>
                <div className='mol-in-cp-input spaced-grid'>
                    <StrLField
                        label='Chain'
                        style='above'
                        id='chain-id'
                        value={this.state.chain}
                        updateNotifier={v => this.setState({ ...this.state, chain: v })}
                        validator={v => v.length <= 1} />
                    <StrLField
                        label='First residue no.'
                        style='above'
                        id='residue-no'
                        value={this.state.firstResidueNo.toString()}
                        validator={v => !isNaN(Num.parseIntStrict(v)) || v.length === 0}
                        updateNotifier={v => this.setState({ ...this.state, firstResidueNo: v })} />
                    <CpTypeLField
                        label='Type'
                        style='above'
                        id='compound-type'
                        value={this.state.compoundType}
                        updateNotifier={v => this.setState({ ...this.state, compoundType: v })}
                        options={[
                                { value: 'RNA', caption: 'RNA' },
                                { value: 'DNA', caption: 'DNA' },
                        ]} />
                    <SeqLField
                        label='Sequence'
                        style='above'
                        id='sequence'
                        value={this.state.sequence}
                        validator={v => isSequenceValid(this.state.compoundType, v) || v.length < this.state.sequence.length}
                        updateNotifier={v => this.setState({ ...this.state, sequence: v })}
                        hint='Enter sequence'
                        spellcheck={false}
                        resizeMode={'vertical'} />
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addSequence(this.props.ctxData);
                        }} />
                </div>
                <ErrorBox
                    errors={this.state.errors} />
                <AddedTable
                    className='mol-in-cp-added spaced-grid'
                    valuesKey='mol-in-cp-added'
                    deleter={this.compoundRemoved}
                    columns={[
                        { caption: 'Chain', k: 'chain' },
                        { caption: 'First residue no.', k: 'firstResidueNo' },
                        { caption: 'Type', k: 'type' },
                        { caption: 'Sequence', k: 'sequence' }]}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace CompoundsInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}
