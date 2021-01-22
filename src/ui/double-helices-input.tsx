/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ErrorBox } from './common/error-box';
import { LabeledField } from './common/controlled/labeled-field';
import { PushButton } from './common/push-button';
import { Util } from './common/util';
import { FormBlock } from './common/form/form-block';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { FormUtil } from '../model/common/form';
import { Manip } from '../util/manip';
import { Num } from '../util/num';

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<DoubleHelix[]>();
const ChainLField = LabeledField.ComboBox<string>();
const ResidueLField = LabeledField.ComboBox<number>();

interface State {
    chainOne?: string;
    firstResNoOne?: number;
    lastResNoOne?: number;
    chainTwo?: string;
    firstResNoTwo?: number;
    errors: string[];
}

export class DoubleHelicesInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, DoubleHelicesInput.Props, State> {
    constructor(props: DoubleHelicesInput.Props) {
        super(props);

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        this.state = {
            errors: new Array<string>(),
            chainOne: compounds.length > 0 ? compounds[0].chain : undefined,
            chainTwo: compounds.length > 0 ? compounds[0].chain : undefined,
        };
    }

    private addDoubleHelix() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        let cA = undefined;
        let cB = undefined;

        const errors = new Array<string>();

        // Sanity checks
        if (this.state.chainOne === undefined || (cA = compounds.find(c => c.chain === this.state.chainOne)) === undefined)
            errors.push('Invalid first chain');
        if (this.state.firstResNoOne === undefined)
            errors.push('First residue on first chain is not set');
        if (this.state.lastResNoOne === undefined)
            errors.push('Last residue on first chain is not set');

        if (this.state.chainTwo === undefined || (cB = compounds.find(c => c.chain === this.state.chainTwo)) === undefined)
            errors.push('Invalid second chain');
        if (this.state.firstResNoTwo === undefined)
            errors.push('First residue on second chain is not set');

        if (errors.length > 0) {
            this.setState({ ...this.state, errors });
            return;
        }

        const firstOne = this.state.firstResNoOne!;
        const lastOne = this.state.lastResNoOne!;
        if (firstOne > lastOne || firstOne > cA!.lastResidueNo)
            errors.push('Invalid residues on first chain')

        const firstTwo = this.state.firstResNoTwo!;
        const lastTwo = firstTwo - (lastOne - firstOne);
        if (firstTwo > cB!.lastResidueNo || lastTwo < cB!.firstResidueNo)
            errors.push('Invalid residues on second chain');
        if (this.state.chainOne! === this.state.chainTwo! && lastOne >= lastTwo)
                errors.push('Paired residues on the same chain cannot overlap');

        if (errors.length > 0) {
            this.setState({ ...this.state, errors });
            return;
        }

        const dh = new DoubleHelix(this.state.chainOne!, firstOne, lastOne, this.state.chainTwo!, firstTwo, lastTwo);
        const helices = FU.getArray<DoubleHelix[]>(this.props.ctxData, 'mol-in-dh-added');
        if (helices.find(e => e.equals(dh)) !== undefined) {
            errors.push('Such double helix already exists');
            this.setState({ ...this.state, errors });
        } else {
            helices.push(dh);
            this.setState({ ...this.state, errors: [] });
            FU.updateValues(this.props.ctxData, [{ key: 'mol-in-dh-added', value: helices }]);
        }
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

        if (compounds.length < 1 && this.state.chainOne === undefined && this.state.chainTwo === undefined)
            return; // Do fuck all;

        if ((compounds.length < 1 ||
             compounds.find(c => c.chain === this.state.chainOne) === undefined ||
             compounds.find(c => c.chain === this.state.chainTwo) === undefined) &&
            (this.state.chainOne !== undefined && this.state.chainTwo !== undefined)) {
            // Revert to empty state
            this.setState({
                ...this.state,
                chainOne: undefined,
                firstResNoOne: undefined,
                lastResNoOne: undefined,
                chainTwo: undefined,
                firstResNoTwo: undefined,
                errors: new Array<string>(),
            });
            return;
        }

        let update: Partial<State> = {};

        if (this.state.chainOne === undefined)
            update = { ...update, chainOne: compounds[0].chain };
        if (this.state.chainTwo === undefined)
            update = { ...update, chainTwo: compounds[0].chain };

        if (this.state.chainOne !== undefined && (this.state.firstResNoOne === undefined || this.state.lastResNoOne === undefined)) {
            const def = MIM.defaultFirstResNo(compounds, this.state.chainOne);
            update = {
                ...update,
                firstResNoOne: def,
                lastResNoOne: def,
            };
        }

        if (this.state.chainTwo !== undefined && this.state.firstResNoTwo === undefined) {
            const def = MIM.defaultFirstResNoRev(compounds, this.state.chainTwo);
            update = {
                ...update,
                firstResNoTwo: def,
            };
        }

        if (Manip.hasDefined(update))
            this.setState({ ...this.state, ...update });
    }

    render() {
        const chains = MIM.chainOptions(this.props.ctxData);
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const [lastSel, lastAvail] = this.lastSelectableResidue(compounds, this.state.firstResNoOne, this.state.lastResNoOne, this.state.chainTwo);
        const secondOpts = (this.state.chainTwo !== undefined) ? (lastAvail ? MIM.residueOptionsRev(compounds, this.state.chainTwo, undefined, lastSel) : []) : [];
        let lastResNoTwo = this.lastResNoTwo(this.state.firstResNoOne, this.state.lastResNoOne, this.state.firstResNoTwo);

        let cTwo: Compound | undefined;
        if (this.state.chainTwo !== undefined && lastResNoTwo !== undefined && (cTwo = compounds.find(c => c.chain === this.state.chainTwo)) !== undefined) {
            if (lastResNoTwo < cTwo.firstResidueNo)
                lastResNoTwo = undefined;
        }

        return (
            <div className='section'>
                <div className='section-caption'>Double helices</div>
                <div className='mol-in-dh-input spaced-grid'>
                    <ChainLField
                        id='first-res-one'
                        label='Chain'
                        style='above'
                        value={this.state.chainOne}
                        updateNotifier={v => {
                            let update: Partial<State> = { chainOne: v };
                            const c = compounds.find(c => c.chain === v);
                            if (c === undefined)
                                update = { ...update, firstResNoOne: undefined, lastResNoOne: undefined };
                            else {
                                if (this.state.firstResNoOne !== undefined && !Num.within(c.firstResidueNo, c.lastResidueNo, this.state.firstResNoOne))
                                    update = { ...update, firstResNoOne: c.firstResidueNo };
                                if (this.state.lastResNoOne !== undefined && !Num.within(c.firstResidueNo, c.lastResidueNo, this.state.lastResNoOne))
                                    update = { ...update, lastResNoOne: c.firstResidueNo };
                            }
                            this.setState({ ...this.state, ...update });
                        }}
                        options={chains}  />
                    <ResidueLField
                        id='first-res-one'
                        label='First residue'
                        style='above'
                        value={this.state.firstResNoOne}
                        stringifier={Util.nToS}
                        updateNotifier={v => this.setState({ ...this.state, firstResNoOne: v })}
                        options={MIM.residueOptions(compounds, this.state.chainOne)} />
                    <ResidueLField
                        id='last-res-one'
                        label='Last residue'
                        style='above'
                        value={this.state.lastResNoOne}
                        updateNotifier={v => this.setState({ ...this.state, lastResNoOne: v })}
                        stringifier={Util.nToS}
                        options={MIM.residueOptions(compounds, this.state.chainOne, this.state.firstResNoOne)} />
                    <ChainLField
                        id='chain-two'
                        label='Chain'
                        style='above'
                        value={this.state.chainTwo}
                        updateNotifier={v => {
                            let update: Partial<State> = { chainTwo: v };
                            const c = compounds.find(c => c.chain === v);
                            if (c === undefined)
                                update = { ...update, firstResNoTwo: undefined };
                            else {
                                if (this.state.firstResNoTwo !== undefined && !Num.within(c.firstResidueNo, c.lastResidueNo, this.state.firstResNoTwo))
                                    update = { ...update, firstResNoTwo: c.lastResidueNo };
                            }
                            this.setState({ ...this.state, ...update });
                        }}
                        options={MIM.chainOptions(this.props.ctxData)} />
                    <ResidueLField
                        id={'last-res-two'}
                        label='First residue'
                        style='above'
                        value={this.state.firstResNoTwo}
                        updateNotifier={v => this.setState({ ...this.state, firstResNoTwo: v })}
                        stringifier={Util.nToS}
                        options={secondOpts} />
                    <div>
                        <div>Last residue</div>
                        <div>{lastResNoTwo ? lastResNoTwo : 'N/A'}</div>
                    </div>
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={e => {
                            e.preventDefault();
                            this.addDoubleHelix();
                        }} />
                </div>
                <ErrorBox
                    errors={this.state.errors} />
                <AddedTable
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
