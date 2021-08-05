/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ErrorBox } from './common/error-box';
import { PushButton } from './common/push-button';
import { Util } from './common/util';
import { LabeledField } from './common/controlled/labeled-field';
import { FormBlock } from './common/form/form-block';
import { Compound } from '../model/compound';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { NtC } from '../model/ntc';
import { NtCConformation } from '../model/ntc-conformation';
import { FormUtil } from '../model/common/form';
import { ComboBox as ComboBoxModel } from '../model/common/combo-box';
import { Manip } from '../util/manip';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<NtCConformation[]>();
const ChainLField = LabeledField.ComboBox<string>();
const ResidueLField = LabeledField.ComboBox<number>();
const NtCLField = LabeledField.ComboBox<NtC.Conformer>();

interface State {
    chain?: string;
    firstResNo?: number;
    lastResNo?: number;
    cfrm?: NtC.Conformer;
    errors: string[];
}

export class NtCsInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, NtCsInput.Props, State> {
    constructor(props: NtCsInput.Props) {
        super(props);

        const viable = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added').filter(c => c.residueCount > 1);

        this.state = {
            chain: viable.length > 0 ? viable[0].chain : undefined,
            firstResNo: viable.length > 0 ? viable[0].firstResidueNo : undefined,
            lastResNo: viable.length > 0 ? viable[0].firstResidueNo + 1 : undefined,
            cfrm: viable.length > 0 ? MIM.AllNtCsOptions[0].value : undefined,
            errors: new Array<string>(),
        };
    }

    private addNtC() {
        const errors = new Array<string>();
        if (this.state.chain === undefined || this.state.firstResNo === undefined || this.state.lastResNo === undefined || this.state.cfrm === undefined) {
            errors.push('Incomplete NtC definition');
            this.setState({ ...this.state, errors });
            return;
        }

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (MIM.getCompound(compounds, this.state.chain) === undefined)
            throw new Error('Invalid chain');

        const ntc = new NtCConformation(this.state.chain, this.state.firstResNo, this.state.lastResNo, this.state.cfrm);
        const ntcs = FU.getArray<NtCConformation[]>(this.props.ctxData, 'mol-in-ntcs-added');

        if (this.state.lastResNo <= this.state.firstResNo)
            throw new Error('Invalid residue numbers');

        if (ntcs.find((e) => e.equals(ntc)) !== undefined) {
            errors.push('Such NtC configuration already exists');
            this.setState({ ...this.state, errors });
        } else {
            ntcs.push(new NtCConformation(this.state.chain, this.state.firstResNo, this.state.lastResNo, this.state.cfrm));
            this.setState({ ...this.state, errors: [] });
            FU.updateValues(this.props.ctxData, [{ key: 'mol-in-ntcs-added', value: ntcs }]);
        }
    }

    componentDidUpdate() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (compounds.some(c => c.residueCount > 1) === false && this.state.chain !== undefined) {
            this.setState({
                ...this.state,
                chain: undefined,
                firstResNo: undefined,
                lastResNo: undefined,
                cfrm: undefined,
                errors: new Array<string>(),
            });
            return;
        }

        if (this.state.chain !== undefined) {
            const c = compounds.find(c => c.chain === this.state.chain);
            if (c === undefined) {
                this.setState({
                    ...this.state,
                    chain: undefined,
                    firstResNo: undefined,
                    lastResNo: undefined,
                    cfrm: undefined,
                    errors: new Array<string>(),
                });
                return;
            }

            let update: Partial<State> = {};
            if (this.state.firstResNo === undefined || this.state.firstResNo >= c.lastResidueNo)
                update = { ...update, firstResNo: c.firstResidueNo };
            if (this.state.lastResNo === undefined || this.state.lastResNo > c.lastResidueNo)
                update = { ...update, lastResNo: c.firstResidueNo + 1 };

            if (Manip.hasDefined(update))
                this.setState({ ...this.state, ...update });
        } else {
            for (let idx = 0; idx < compounds.length; idx++) {
                const c = compounds[idx];
                if (c.residueCount < 2)
                    continue;

                let update: Partial<State> = {
                    chain: c.chain,
                    firstResNo: c.firstResidueNo,
                    lastResNo: c.firstResidueNo + 1,
                    cfrm: MIM.AllNtCsOptions[0].value,
                };
                this.setState({ ...this.state, ...update });
                return;
            }
        }
    }

    render() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const chains = MIM.chainOptions(this.props.ctxData).filter(o => compounds.find(c => c.chain === o.value)!.residueCount > 1);

        let firstResOpts = new Array<ComboBoxModel.Option<number>>();
        let lastResOpts = new Array<ComboBoxModel.Option<number>>();
        if (this.state.chain !== undefined) {
            const c = MIM.getCompound(compounds, this.state.chain);
            if (c !== undefined) {

                firstResOpts = MIM.residueOptions(compounds, this.state.chain, c.firstResidueNo, c.lastResidueNo - 1);
                const firstResNo = this.state.firstResNo ?? NaN;
                if (!isNaN(firstResNo) && firstResNo >= c.firstResidueNo && firstResNo <= c.lastResidueNo)
                    lastResOpts = MIM.residueOptions(compounds, this.state.chain, firstResNo + 1);
                else
                    lastResOpts = MIM.residueOptions(compounds, this.state.chain, c.firstResidueNo + 1);
            }
        }

        return (
            <div className='section'>
                <div className='section-caption'>NtCs</div>
                <div className='mol-in-ntcs-input spaced-grid'>
                    <ChainLField
                        id='mol-in-ntcs-chain'
                        label='Chain'
                        style='above'
                        value={this.state.chain}
                        updateNotifier={v => this.setState({ ...this.state, chain: v })}
                        options={chains} />
                    <ResidueLField
                        id='mol-in-ntcs-first-res-no'
                        label='First residue'
                        style='above'
                        value={this.state.firstResNo}
                        updateNotifier={v => {
                            const c = compounds.find(c => c.chain === this.state.chain);
                            if (c === undefined)
                                throw new Error(`Compound with chain ${this.state.chain} does not exist`);

                            let update: Partial<State> = { firstResNo: v };
                            if (this.state.lastResNo === undefined || this.state.lastResNo <= v)
                                update = { ...update, lastResNo: v + 1 };

                            this.setState({ ...this.state, ...update })}
                        }
                        stringifier={Util.nToS}
                        options={firstResOpts} />
                    <ResidueLField
                        id='mol-in-ntcs-last-res-no'
                        label='Last residue'
                        style='above'
                        value={this.state.lastResNo}
                        updateNotifier={v => this.setState({ ...this.state, lastResNo: v })}
                        stringifier={Util.nToS}
                        options={lastResOpts} />
                    <NtCLField
                        id='mol-in-ntcs-ntc'
                        label='NtC'
                        style='above'
                        value={this.state.cfrm}
                        updateNotifier={v => this.setState({ ...this.state, cfrm: v })}
                        options={MIM.AllNtCsOptions} />
                    <PushButton
                        className="pushbutton-common pushbutton-add"
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addNtC();
                        }} />
                </div>
                <ErrorBox
                    errors={this.state.errors} />
                <AddedTable
                    className='mol-in-ntcs-added spaced-grid'
                    valuesKey='mol-in-ntcs-added'
                    columns={[
                        {caption: 'Chain', k: 'chain'},
                        {caption: 'First residue', k: 'firstResidueNo'},
                        {caption: 'Last residue', k: 'lastResidueNo'},
                        {caption: 'NtC', k: 'ntc'}]}
                    hideHeader={true}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace NtCsInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}
