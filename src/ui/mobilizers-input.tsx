/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { LabeledField } from './common/controlled/labeled-field';
import { FormBlock } from './common/form/form-block';
import { ErrorBox } from './common/error-box';
import { PushButton } from './common/push-button';
import { Util } from './common/util';
import { FormUtil } from '../model/common/form';
import { Compound } from '../model/compound';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { BondMobility, Mobilizer, ResidueSpan } from '../model/mobilizer';
import { ComboBox as ComboBoxModel } from '../model/common/combo-box';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();

type AllItems = 'all-items';

const AddedTable = MIM.TWDR<Mobilizer[]>();
const BMLField = LabeledField.ComboBox<BondMobility>();
const ChainLField = LabeledField.ComboBox<string | AllItems>();
const FResNoLField = LabeledField.ComboBox<number | AllItems>();
const LResNoLField = LabeledField.ComboBox<number>();

function within<T>(lo: T, hi: T, val: T) {
    return lo <= val && val <= hi;
}

function rToS(v: number | AllItems | undefined) {
    if (v === undefined)
        return '';
    if (typeof v === 'string' && v === 'all-items')
        return 'all-items';
    else if (typeof v === 'number')
        return v.toString();
    throw new Error('Invalid value type');
}

interface State {
    bondMobility: BondMobility;
    chain: string | AllItems;
    firstResNo: number | AllItems;
    lastResNo?: number;
    errors: string[];
}

export class MobilizersInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, MobilizersInput.Props, State> {
    constructor(props: MobilizersInput.Props) {
        super(props);

        this.state = {
            bondMobility: 'Rigid',
            chain: 'all-items',
            firstResNo: 'all-items',
            lastResNo: undefined,
            errors: new Array<string>(),
        };
    }

    private addMobilizer() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const mobilizers = FU.getArray<Mobilizer[]>(this.props.ctxData, 'mol-in-mobilizers-added');

        try {
            const m = (() => {
                if (this.state.chain === 'all-items')
                    return new Mobilizer(this.state.bondMobility);
                else {
                    if (this.state.firstResNo === 'all-items')
                        return new Mobilizer(this.state.bondMobility, this.state.chain);
                    else {
                        const first = this.state.firstResNo;
                        const last = this.state.lastResNo;

                        if (last === undefined)
                            throw new Error('Last residue no is undefined');

                        if (last < first)
                            throw new Error('Last residue number is lower than first residue number');

                        return new Mobilizer(this.state.bondMobility, this.state.chain, new ResidueSpan(first, last));
                    }
                }
            })();

            if (this.state.chain !== 'all-items') {
                if (compounds.find(c => c.chain === this.state.chain) === undefined)
                    throw new Error(`Chain ${this.state.chain} was selected but there is no compound with such chain ID`);
            }
            this.checkAllowed(m, mobilizers);
            mobilizers.push(m);

            FU.updateValue(this.props.ctxData, { key: 'mol-in-mobilizers-added', value: mobilizers } );
            this.setState({
                ...this.state,
                errors: [],
            });
        } catch (e) {
            this.setState({
                ...this.state,
                errors: [e.toString()],
            });
        }
    }

    private checkAllowed(m: Mobilizer, mobilizers: Mobilizer[]) {
        if (m.chain === undefined && mobilizers.length > 0)
            throw new Error('Cannot add mobilizer for the entire structure when there are some other mobilizers already set');

        for (const om of mobilizers) {
            if (m === om)
                throw new Error('Such mobilizer already exists');

            if (om.chain === undefined)
                throw new Error('Cannnot add mobilizer when there is a mobilizer already set for the entire structure');

            if (m.chain === om.chain) {
                if (m.residueSpan === undefined)
                    throw new Error(`Cannot add mobilizer for the entire chain when there are some other mobilizers already set for chain ${om.chain}`);
                if (om.residueSpan === undefined)
                    throw new Error(`Cannot add mobilizer for chain ${om.chain} when there is a mobilizer for the entire chain already set for that chain`);

                if (m.residueSpan.overlap(om.residueSpan))
                    throw new Error('Mobilizers residue spans cannot overlap');
            }
        }
    }

    private makeChainOptions(compounds: Compound[]) {
        if (compounds.length === 0)
            return [];

        const opts: ComboBoxModel.Option<string | AllItems>[] = [ { value: 'all-items', caption: 'All chains'} ];
        compounds.forEach(c => opts.push({ value: c.chain, caption: c.chain }));

        return opts;
    }

    mobilizerRemoved = (m: Mobilizer) => {
        const mobilizers = FU.getArray<Mobilizer[]>(this.props.ctxData, 'mol-in-mobilizers-added');
        const filtered = mobilizers.filter(om => om !== m)

        FU.updateValue(this.props.ctxData, { key: 'mol-in-mobilizers-added', value: filtered } );
    }

    componentDidUpdate() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        if (compounds.length < 1 && (this.state.chain !== 'all-items' || this.state.firstResNo !== 'all-items' || this.state.lastResNo !== undefined)) {
            this.setState({
                ...this.state,
                chain: 'all-items',
                firstResNo: 'all-items',
                lastResNo: undefined,
            });
            return;
        }

        if (this.state.chain === 'all-items') {
            if (this.state.firstResNo !== 'all-items' || this.state.lastResNo !== undefined) {
                this.setState({
                    ...this.state,
                    firstResNo: 'all-items',
                    lastResNo: undefined,
                });
            }
            return;
        }

        const c = compounds.find(c => c.chain === this.state.chain);
        if (c === undefined) {
            console.error(`Chain ${this.state.chain} was selected but there is no compound with such chain ID`);
            return;
        }

        if (this.state.firstResNo !== 'all-items' && !within(c.firstResidueNo, c.lastResidueNo, this.state.firstResNo)) {
            this.setState({
                ...this.state,
                firstResNo: 'all-items',
                lastResNo: undefined,
            });
            return;
        } else if (this.state.firstResNo !== 'all-items' && (this.state.lastResNo === undefined || this.state.lastResNo < this.state.firstResNo)) {
            this.setState({
                ...this.state,
                lastResNo: this.state.firstResNo
            });
            return;
        }

        if (this.state.lastResNo !== undefined) {
            if (this.state.firstResNo === 'all-items') {
                this.setState({
                    ...this.state,
                    lastResNo: undefined,
                })
            } else if (!within(c.firstResidueNo, c.lastResidueNo, this.state.lastResNo)) {
                this.setState({
                    ...this.state,
                    lastResNo: this.state.firstResNo,
                });
            }
        }
    }

    render() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        const firstResNoOpts: ComboBoxModel.Option<number | AllItems>[] = [ { value: 'all-items', caption: 'All residues' } ];
        const lastResNoOpts: ComboBoxModel.Option<number>[] = [];

        if (this.state.chain !== 'all-items') {
            const c = compounds.find(c => c.chain === this.state.chain);
            if (c === undefined)
                console.error(`Chain ${this.state.chain} was selected but there is no compound with such chain ID`);
            else {
                for (let i = c.firstResidueNo; i <= c.lastResidueNo; i++)
                    firstResNoOpts.push({ value: i, caption: i.toString() } );

                if (this.state.firstResNo !== 'all-items') {
                    const lastFrom = this.state.firstResNo;
                    for (let i = lastFrom; i <= c.lastResidueNo; i++)
                        lastResNoOpts.push({ value: i, caption: i.toString() });
                }
            }
        }

        return (
            <div className='section'>
                <div className='section-caption'>Mobilizers</div>
                <div className='mol-in-mobilizers-input spaced-grid'>
                    <BMLField
                        id='mobilizers-bond-mobility'
                        label='Bond mobility'
                        style='above'
                        options={[
                            { value: 'Rigid', caption: 'Rigid' },
                            { value: 'Torsion', caption: 'Torsion' },
                            { value: 'Free', caption: 'Free' }
                        ]}
                        value={this.state.bondMobility}
                        updateNotifier={v => this.setState({ ...this.state, bondMobility: v })} />
                    <ChainLField
                        id='mobilizers-chain'
                        label='Chain'
                        style='above'
                        options={this.makeChainOptions(compounds)}
                        value={this.state.chain}
                        updateNotifier={v => this.setState({ ...this.state, chain: v })} />
                    <FResNoLField
                        id='mobilizers-first-res-no'
                        label='First residue'
                        style='above'
                        options={firstResNoOpts}
                        value={this.state.firstResNo}
                        disabled={firstResNoOpts.length < 2}
                        stringifier={rToS}
                        updateNotifier={v => this.setState({ ...this.state, firstResNo: v })} />
                    <LResNoLField
                        id='mobilizers-last-res-no'
                        label='Last residue'
                        style='above'
                        options={lastResNoOpts}
                        value={this.state.lastResNo}
                        disabled={lastResNoOpts.length < 1}
                        stringifier={Util.nToS}
                        updateNotifier={v => this.setState({ ...this.state, lastResNo: v })} />
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={e => {
                            e.preventDefault();
                            this.addMobilizer();
                        }} />
                </div>
                <ErrorBox
                    errors={this.state.errors} />
                <AddedTable
                    className='mol-in-mobilizers-added spaced-grid'
                    valuesKey='mol-in-mobilizers-added'
                    deleter={this.mobilizerRemoved}
                    columns={[
                        { caption: 'Bond mobility', k: 'bondMobility' },
                        { caption: 'Chain', k: 'chain' },
                        { caption: 'Residue span', k: 'residueSpan', stringify: (v: ResidueSpan) => `${v.first} -> ${v.last}` },
                    ]}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace MobilizersInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}

