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
import { DefaultNtCForceScaleFactor, NtCConformation, NtCs } from '../model/ntc-conformation';
import { FormUtil } from '../model/common/form';
import { ComboBox as ComboBoxModel } from '../model/common/combo-box';
import { Manip } from '../util/manip';
import { Num } from '../util/num';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<NtCConformation[]>();
const ChainLField = LabeledField.ComboBox<string>();
const ResidueLField = LabeledField.ComboBox<number>();
const NtCLField = LabeledField.ComboBox<NtC.Conformer>();
const NumLField = LabeledField.LineEdit<string>();

interface State {
    chainName?: string;
    firstResNo?: number;
    lastResNo?: number;
    cfrm?: NtC.Conformer;
    forceScaleFactor: number|null;
    errors: string[];
}

export class NtCsInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, NtCsInput.Props, State> {
    constructor(props: NtCsInput.Props) {
        super(props);

        const viable = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added').filter(c => c.residues.length > 1);

        this.state = {
            chainName: viable.length > 0 ? viable[0].chain.name : undefined,
            firstResNo: viable.length > 0 ? viable[0].firstResidue().number : undefined,
            lastResNo: viable.length > 0 ? viable[0].residues[1].number : undefined,
            cfrm: viable.length > 0 ? MIM.AllNtCsOptions[0].value : undefined,
            forceScaleFactor: DefaultNtCForceScaleFactor,
            errors: new Array<string>(),
        };
    }

    private addNtC() {
        const errors = new Array<string>();
        if (this.state.chainName === undefined || this.state.firstResNo === undefined || this.state.lastResNo === undefined || this.state.cfrm === undefined) {
            errors.push('Incomplete NtC definition');
            this.setState({ ...this.state, errors });
            return;
        }

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (MIM.getCompound(compounds, this.state.chainName) === undefined)
            throw new Error('Invalid chain');

        const ntc = new NtCConformation(this.state.chainName, this.state.firstResNo, this.state.lastResNo, this.state.cfrm);
        const ntcs = FU.getScalar(this.props.ctxData, 'mol-in-ntcs-added', NtCs.empty());
        const conformations = ntcs.conformations;

        if (this.state.lastResNo <= this.state.firstResNo)
            throw new Error('Invalid residue numbers');

        if (this.state.forceScaleFactor === null || this.state.forceScaleFactor < 0)
            throw new Error('Force scale factor must be a non-negative number');

        if (conformations.find((e) => e.equals(ntc)) !== undefined) {
            errors.push('Such NtC configuration already exists');
            this.setState({ ...this.state, errors });
        } else {
            conformations.push(new NtCConformation(this.state.chainName, this.state.firstResNo, this.state.lastResNo, this.state.cfrm));
            this.setState({ ...this.state, errors: [] });
            FU.updateValue(this.props.ctxData, { key: 'mol-in-ntcs-added', value: { conformations, forceScaleFactor: this.state.forceScaleFactor } });
        }
    }

    componentDidUpdate() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (compounds.some(c => c.residues.length > 1) === false && this.state.chainName !== undefined) {
            this.setState({
                ...this.state,
                chainName: undefined,
                firstResNo: undefined,
                lastResNo: undefined,
                cfrm: undefined,
                errors: new Array<string>(),
            });
            return;
        }

        if (this.state.chainName !== undefined) {
            const c = compounds.find(c => c.chain.name === this.state.chainName);
            if (c === undefined) {
                this.setState({
                    ...this.state,
                    chainName: undefined,
                    firstResNo: undefined,
                    lastResNo: undefined,
                    cfrm: undefined,
                    errors: new Array<string>(),
                });
                return;
            }

            let update: Partial<State> = {};
            if (this.state.firstResNo === undefined || this.state.firstResNo >= c.lastResidue().number)
                update = { ...update, firstResNo: c.firstResidue().number };
            if (this.state.lastResNo === undefined || this.state.lastResNo > c.lastResidue().number)
                update = { ...update, lastResNo: c.residues[1].number };

            if (Manip.hasDefined(update))
                this.setState({ ...this.state, ...update });
        } else {
            for (let idx = 0; idx < compounds.length; idx++) {
                const c = compounds[idx];
                if (c.residues.length < 2)
                    continue;

                const update: Partial<State> = {
                    chainName: c.chain.name,
                    firstResNo: c.firstResidue().number,
                    lastResNo: c.residues[1].number,
                    cfrm: MIM.AllNtCsOptions[0].value,
                };
                this.setState({ ...this.state, ...update });
                return;
            }
        }
    }

    render() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const chains = MIM.chainOptions(this.props.ctxData).filter(o => compounds.find(c => c.chain.name === o.value)!.residues.length > 1);

        let firstResOpts = new Array<ComboBoxModel.Option<number>>();
        let lastResOpts = new Array<ComboBoxModel.Option<number>>();
        if (this.state.chainName !== undefined) {
            const c = MIM.getCompound(compounds, this.state.chainName);
            if (c !== undefined) {

                firstResOpts = MIM.residueOptions(compounds, this.state.chainName, c.firstResidue().number, c.residues[c.residues.length - 2].number);
                const firstResNo = this.state.firstResNo ?? NaN;
                if (!isNaN(firstResNo) && firstResNo >= c.firstResidue().number && firstResNo <= c.lastResidue().number) {
                    let idx = 0;
                    while (idx < c.residues.length - 1 && c.residues[idx].number <= firstResNo)
                        idx++;
                    lastResOpts = MIM.residueOptions(compounds, this.state.chainName, c.residues[idx].number);
                } else
                    lastResOpts = MIM.residueOptions(compounds, this.state.chainName, c.residues[1].number);
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
                        value={this.state.chainName}
                        updateNotifier={v => this.setState({ ...this.state, chainName: v })}
                        options={chains} />
                    <ResidueLField
                        id='mol-in-ntcs-first-res-no'
                        label='First residue'
                        style='above'
                        value={this.state.firstResNo}
                        updateNotifier={v => {
                            const c = compounds.find(c => c.chain.name === this.state.chainName);
                            if (c === undefined)
                                throw new Error(`Compound with chain ${this.state.chainName} does not exist`);

                            let update: Partial<State> = { firstResNo: v };
                            if (this.state.lastResNo === undefined || this.state.lastResNo <= v)
                                update = { ...update, lastResNo: v + 1 };

                            this.setState({ ...this.state, ...update });
                        }}
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
                <NumLField
                    id='mol-in-ntcs-force-scale-factor'
                    label='Force scale factor'
                    style='above'
                    tooltip='NtCforceScaleFactor'
                    value={this.state.forceScaleFactor !== null ? this.state.forceScaleFactor.toString() : ''}
                    updateNotifier={v => {
                        if (v === '')
                            this.setState({ ...this.state, forceScaleFactor: null });
                        else {
                            const num = Num.parseIntStrict(v);
                            if (!isNaN(num)) {
                                this.setState(({ ...this.state, forceScaleFactor: num }));

                                const ntcs = FU.getScalar(this.props.ctxData, 'mol-in-ntcs-added', NtCs.empty());
                                FU.updateValue(
                                    this.props.ctxData,
                                    {
                                        key: 'mol-in-ntcs-added',
                                        value: { conformations: ntcs.conformations, forceScaleFactor: num },
                                    },
                                );
                            }
                        }
                    }} />
                <ErrorBox
                    errors={this.state.errors} />
                <AddedTable
                    className='mol-in-ntcs-added spaced-grid'
                    valuesKey='mol-in-ntcs-added'
                    columns={[
                        {caption: 'Chain', k: 'chainName', stringify: (v,_i) => {
                            const c = compounds.find(c => c.chain.name === v); return c ? Util.chainToString(c.chain) : 'N/A';
                        }},
                        {caption: 'First residue', k: 'firstResidueNo', stringify: (v, i) => {
                            const c = compounds.find(c => c.chain.name === i.chainName);
                            if (!c) return 'N/A';
                            const res = c.residueByNumber(v);
                            return res ? Util.resNumToString(res) : 'N/A';
                        }},
                        {caption: 'Last residue', k: 'lastResidueNo', stringify: (v, i) => {
                            const c = compounds.find(c => c.chain.name === i.chainName);
                            if (!c) return 'N/A';
                            const res = c.residueByNumber(v);
                            return res ? Util.resNumToString(res) : 'N/A';
                        }},
                        {caption: 'NtC', k: 'ntc'}]}
                    hideHeader={false}
                    rowsGetter={ctx => {
                        const ntcs = FU.getScalar(ctx, 'mol-in-ntcs-added', NtCs.empty());
                        return ntcs.conformations;
                    }}
                    deleter={(idx, ctxData) => {
                        const ntcs = FU.getScalar(ctxData, 'mol-in-ntcs-added', NtCs.empty());
                        const conformations = [...ntcs.conformations];
                        conformations.splice(idx, 1);

                        FU.updateValue(
                            ctxData,
                            {
                                key: 'mol-in-ntcs-added',
                                value: { conformations, forceScaleFactor: ntcs.forceScaleFactor },
                            },
                        );
                    }}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace NtCsInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}
