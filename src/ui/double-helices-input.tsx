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
    chainNameOne?: string;
    firstResNoOne?: number;
    lastResNoOne?: number;
    chainNameTwo?: string;
    firstResNoTwo?: number;
    errors: string[];
}

export class DoubleHelicesInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, DoubleHelicesInput.Props, State> {
    constructor(props: DoubleHelicesInput.Props) {
        super(props);

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        this.state = {
            errors: new Array<string>(),
            chainNameOne: compounds.length > 0 ? compounds[0].chain.name : undefined,
            chainNameTwo: compounds.length > 0 ? compounds[0].chain.name : undefined,
            firstResNoOne: compounds.length > 0 ? compounds[0].firstResidue().number : undefined,
            lastResNoOne: compounds.length > 0 ? compounds[0].firstResidue().number : undefined,
            firstResNoTwo: compounds.length > 0 ? compounds[0].lastResidue().number : undefined,
        };
    }

    private addDoubleHelix() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        let cA = undefined;
        let cB = undefined;

        const errors = new Array<string>();

        // Sanity checks
        if (this.state.chainNameOne === undefined || (cA = compounds.find(c => c.chain.name === this.state.chainNameOne)) === undefined)
            errors.push('Invalid first chain');
        if (this.state.firstResNoOne === undefined)
            errors.push('First residue on first chain is not set');
        if (this.state.lastResNoOne === undefined)
            errors.push('Last residue on first chain is not set');

        if (this.state.chainNameTwo === undefined || (cB = compounds.find(c => c.chain.name === this.state.chainNameTwo)) === undefined)
            errors.push('Invalid second chain');
        if (this.state.firstResNoTwo === undefined)
            errors.push('First residue on second chain is not set');

        if (errors.length > 0) {
            this.setState({ ...this.state, errors });
            return;
        }

        const firstOne = this.state.firstResNoOne!;
        const lastOne = this.state.lastResNoOne!;
        if (firstOne > lastOne || firstOne > cA!.lastResidue().number)
            errors.push('Invalid residues on first chain')

        const firstTwo = this.state.firstResNoTwo!;
        const lastTwo = firstTwo - (lastOne - firstOne);
        if (firstTwo > cB!.lastResidue().number || lastTwo < cB!.firstResidue().number)
            errors.push('Invalid residues on second chain');
        if (this.state.chainNameOne! === this.state.chainNameTwo! && lastOne >= lastTwo)
                errors.push('Paired residues on the same chain cannot overlap');

        if (errors.length > 0) {
            this.setState({ ...this.state, errors });
            return;
        }

        const dh = new DoubleHelix(this.state.chainNameOne!, firstOne, lastOne, this.state.chainNameTwo!, firstTwo, lastTwo);
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

    private lastSelectableResidue(compounds: Compound[], firstResNoOne?: number, lastResNoOne?: number, chainNameTwo?: string) : [number|undefined, boolean] {
        if (firstResNoOne === undefined || lastResNoOne === undefined || chainNameTwo === undefined)
            return [undefined, true];

        if (lastResNoOne < firstResNoOne)
            return [undefined, true];

        const comp = compounds.find(c => c.chain.name, chainNameTwo);
        if (comp === undefined)
            return [undefined, true];
        const last = comp.firstResidue().number + (lastResNoOne - firstResNoOne);
        if (last > comp.lastResidue().number)
            return [undefined, false];
        return [last, true];
    }

    componentDidUpdate() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        if (compounds.length < 1 && this.state.chainNameOne === undefined && this.state.chainNameTwo === undefined)
            return; // Do fuck all;
        if (compounds.length > 0 && this.state.chainNameOne === undefined && this.state.chainNameTwo === undefined) {
            // Set reasonable initial state
            const c = compounds[0];
            this.setState({
                ...this.state,
                chainNameOne: c.chain.name,
                firstResNoOne: c.firstResidue().number,
                lastResNoOne: c.firstResidue().number,
                chainNameTwo: c.chain.name,
                firstResNoTwo: c.lastResidue().number
            });
            return;
        }

        if ((compounds.length < 1 ||
             compounds.find(c => c.chain.name === this.state.chainNameOne) === undefined ||
             compounds.find(c => c.chain.name === this.state.chainNameTwo) === undefined) &&
            (this.state.chainNameOne !== undefined && this.state.chainNameTwo !== undefined)) {
            // Revert to empty state
            this.setState({
                ...this.state,
                chainNameOne: undefined,
                firstResNoOne: undefined,
                lastResNoOne: undefined,
                chainNameTwo: undefined,
                firstResNoTwo: undefined,
                errors: new Array<string>(),
            });
            return;
        }

        let update: Partial<State> = {};

        if (this.state.chainNameOne === undefined)
            update = { ...update, chainNameOne: compounds[0].chain.name };
        if (this.state.chainNameTwo === undefined)
            update = { ...update, chainNameTwo: compounds[0].chain.name };

        if (this.state.chainNameOne !== undefined && (this.state.firstResNoOne === undefined || this.state.lastResNoOne === undefined)) {
            const def = MIM.defaultFirstResNo(compounds, this.state.chainNameOne);
            update = {
                ...update,
                firstResNoOne: def,
                lastResNoOne: def,
            };
        }

        if (this.state.chainNameTwo !== undefined && this.state.firstResNoTwo === undefined) {
            const def = MIM.defaultFirstResNoRev(compounds, this.state.chainNameTwo);
            update = {
                ...update,
                firstResNoTwo: def,
            };
        }

        if ((this.state.chainNameOne === this.state.chainNameTwo) && (this.state.chainNameOne !== undefined) &&
            (this.state.firstResNoOne !== undefined && this.state.lastResNoOne) &&
            (this.state.firstResNoOne > this.state.lastResNoOne)) {
            update = {
                ...update,
                lastResNoOne: this.state.firstResNoOne,
            };
        }

        if (Manip.hasDefined(update))
            this.setState({ ...this.state, ...update });
    }

    render() {
        const chains = MIM.chainOptions(this.props.ctxData);
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const [lastSel, lastAvail] = this.lastSelectableResidue(compounds, this.state.firstResNoOne, this.state.lastResNoOne, this.state.chainNameTwo);
        const secondOpts = (this.state.chainNameTwo !== undefined) ? (lastAvail ? MIM.residueOptionsRev(compounds, this.state.chainNameTwo, undefined, lastSel) : []) : [];
        let lastResNoTwo = this.lastResNoTwo(this.state.firstResNoOne, this.state.lastResNoOne, this.state.firstResNoTwo);

        let cTwo: Compound | undefined;
        if (this.state.chainNameTwo !== undefined && lastResNoTwo !== undefined && (cTwo = compounds.find(c => c.chain.name === this.state.chainNameTwo)) !== undefined) {
            if (lastResNoTwo < cTwo.firstResidue().number)
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
                        value={this.state.chainNameOne}
                        updateNotifier={v => {
                            let update: Partial<State> = {};
                            const c = compounds.find(c => c.chain.name === v);
                            if (c === undefined)
                                update = { ...update, chainNameOne: undefined, firstResNoOne: undefined, lastResNoOne: undefined };
                            else {
                                update = { ...update, chainNameOne: c.chain.name };
                                if (this.state.firstResNoOne !== undefined && !Num.within(c.firstResidue().number, c.lastResidue().number, this.state.firstResNoOne))
                                    update = { ...update, firstResNoOne: c.firstResidue().number };
                                if (this.state.lastResNoOne !== undefined && !Num.within(c.firstResidue().number, c.lastResidue().number, this.state.lastResNoOne))
                                    update = { ...update, lastResNoOne: c.firstResidue().number };
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
                        options={MIM.residueOptions(compounds, this.state.chainNameOne)} />
                    <ResidueLField
                        id='last-res-one'
                        label='Last residue'
                        style='above'
                        value={this.state.lastResNoOne}
                        updateNotifier={v => this.setState({ ...this.state, lastResNoOne: v })}
                        stringifier={Util.nToS}
                        options={MIM.residueOptions(compounds, this.state.chainNameOne, this.state.firstResNoOne)} />
                    <ChainLField
                        id='chain-two'
                        label='Chain'
                        style='above'
                        value={this.state.chainNameTwo}
                        updateNotifier={v => {
                            let update: Partial<State> = {};
                            const c = compounds.find(c => c.chain.name === v);
                            if (c === undefined)
                                update = { ...update, chainNameTwo: undefined, firstResNoTwo: undefined };
                            else {
                                update = { ...update, chainNameTwo: c.chain.name };
                                if (this.state.firstResNoTwo !== undefined && !Num.within(c.firstResidue().number, c.lastResidue().number, this.state.firstResNoTwo))
                                    update = { ...update, firstResNoTwo: c.lastResidue().number };
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
                        {caption: 'Chain', k: 'chainNameOne'},
                        {caption: 'First residue', k: 'firstResidueNoOne'},
                        {caption: 'Last residue', k: 'lastResidueNoOne'},
                        {caption: 'Chain', k: 'chainNameTwo'},
                        {caption: 'First residue', k: 'firstResidueNoTwo'},
                        {caption: 'Last residue', k: 'lastResidueNoTwo'}]}
                    hideHeader={true}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace DoubleHelicesInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}
