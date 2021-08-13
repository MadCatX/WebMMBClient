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
import { LabeledField } from './common/controlled/labeled-field';
import { FormBlock } from './common/form/form-block';
import { Util } from './common/util';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { EdgeInteraction } from '../model/edge-interaction';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { Orientation } from '../model/orientation';
import { ComboBox as ComboBoxModel } from '../model/common/combo-box';
import { FormUtil } from '../model/common/form';
import { Manip } from '../util/manip';
import { Num } from '../util/num';

const EdgeOptions = EdgeInteraction.Edges.map(e => {
    return { value: e, caption: EdgeInteraction.toString(e) } as ComboBoxModel.Option<EdgeInteraction.Edge>;
});
const OrientationOptions = Orientation.Orientations.map(v => {
    return { value: v, caption: v } as ComboBoxModel.Option<Orientation.Orientation>;
});

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<BaseInteraction[]>();

const ChainLField = LabeledField.ComboBox<string>();
const ResidueLField = LabeledField.ComboBox<number>();
const EdgeLField = LabeledField.ComboBox<EdgeInteraction.Edge>();
const OrientLField = LabeledField.ComboBox<Orientation.Orientation>();

interface State {
    chainNameOne?: string;
    residueNoOne?: number;
    edgeOne?: EdgeInteraction.Edge;
    chainNameTwo?: string;
    residueNoTwo?: number;
    edgeTwo?: EdgeInteraction.Edge;
    orientation?: Orientation.Orientation;
    errors: string[];
}

export class BaseInteractionsInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, BaseInteractionsInput.Props, State> {
    constructor(props: BaseInteractionsInput.Props) {
        super(props);

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        // FIXME: Account for author residue numbering too! (This need to be done in more places)
        this.state = {
            chainNameOne: compounds.length > 0 ? compounds[0].chain.name : undefined,
            chainNameTwo: compounds.length > 0 ? compounds[0].chain.name : undefined,
            residueNoOne: compounds.length > 0 ? compounds[0].residues[0].number : undefined,
            residueNoTwo: compounds.length > 0 ? compounds[0].residues[0].number : undefined,
            edgeOne: 'WatsonCrick',
            edgeTwo: 'WatsonCrick',
            orientation: 'Cis',
            errors: new Array<string>(),
        };
    }

    private addBaseInteraction() {
        if (this.state.chainNameOne === undefined || this.state.residueNoOne === undefined || this.state.edgeOne === undefined ||
            this.state.chainNameTwo === undefined || this.state.residueNoTwo === undefined || this.state.edgeTwo === undefined ||
            this.state.orientation === undefined) {
            this.setState({ ...this.state, errors: [ 'Incomplete base interaction definition' ] });
            return;
        }

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (compounds.find(c => c.chain.name === this.state.chainNameOne) === undefined || compounds.find(c => c.chain.name === this.state.chainNameTwo) === undefined) {
            this.setState({ ...this.state, errors: [ 'Invalid chains' ] });
            return;
        }

        if (this.state.residueNoOne === this.state.residueNoTwo && this.state.chainNameOne === this.state.chainNameTwo) {
            this.setState({ ...this.state, errors: [ 'Residue cannot interact with itself' ] });
            return;
        }

        const interactions = FU.getArray<BaseInteraction[]>(this.props.ctxData, 'mol-in-bi-added');
        const bi = new BaseInteraction(
            this.state.chainNameOne,
            this.state.residueNoOne,
            this.state.edgeOne,
            this.state.chainNameTwo,
            this.state.residueNoTwo,
            this.state.edgeTwo,
            this.state.orientation
        );

        if (interactions.find(e => e.equals(bi)) !== undefined) {
            this.setState({ ...this.state, errors: [ 'Such base interaction already exists' ] });
            return;
        }

        interactions.push(bi);
        this.setState({ ...this.state, errors: [] });
        FU.updateValues(this.props.ctxData, [{ key: 'mol-in-bi-added', value: interactions }]);
    }

    componentDidUpdate() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        if (compounds.length < 1 && this.state.chainNameOne === undefined && this.state.chainNameTwo === undefined)
            return; // Do fuck all;

        if (compounds.length < 1 ||
            (compounds.find(c => c.chain.name === this.state.chainNameOne) === undefined ||
             compounds.find(c => c.chain.name === this.state.chainNameTwo) === undefined) &&
             (this.state.chainNameOne !== undefined || this.state.chainNameTwo !== undefined)
           ) {
            // Revert to empty statae
            this.setState({
                ...this.state,
                chainNameOne: undefined,
                residueNoOne: undefined,
                chainNameTwo: undefined,
                residueNoTwo: undefined,
                errors: new Array<string>(),
            });
            return;
        }

        let update: Partial<State> =  {};

        if (this.state.chainNameOne === undefined)
            update = { ...update, chainNameOne: compounds[0].chain.name };
        if (this.state.chainNameTwo === undefined)
            update = { ...update, chainNameTwo: compounds[0].chain.name };

        if (this.state.chainNameOne !== undefined && this.state.residueNoOne === undefined) {
            const def = MIM.defaultFirstResNo(compounds, this.state.chainNameOne);
            update = { ...update, residueNoOne: def };
        }
        if (this.state.chainNameTwo !== undefined && this.state.residueNoTwo === undefined) {
            const def = MIM.defaultFirstResNo(compounds, this.state.chainNameTwo);
            update = { ...update, residueNoTwo: def };
        }

        if (Manip.hasDefined(update))
            this.setState({ ...this.state, ...update });
    }

    render() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        return (
            <div className='section'>
                <div className='section-caption'>Base interactions</div>
                <div className='mol-in-bi-input spaced-grid'>
                    <ChainLField
                        id='mol-in-bi-chain-one'
                        label='Chain'
                        style='above'
                        value={this.state.chainNameOne}
                        updateNotifier={v => {
                            let update: Partial<State> = {};
                            const c = compounds.find(c => c.chain.name === v);
                            if (c === undefined)
                                update = { ...update, chainNameOne : undefined, residueNoOne: undefined }
                            else {
                                update = { ...update, chainNameOne: c.chain.name };
                                if (this.state.residueNoOne === undefined || !Num.within(c.firstResidue().number, c.lastResidue().number, this.state.residueNoOne))
                                    update = { ...update, residueNoOne: c.firstResidue().number };
                            }
                            this.setState({ ...this.state, ...update });
                        }}
                        options={MIM.chainOptions(this.props.ctxData)} />
                    <ResidueLField
                        id='mol-in-bi-res-no-one'
                        label='Residue'
                        style='above'
                        value={this.state.residueNoOne}
                        updateNotifier={v => this.setState({ ...this.state, residueNoOne: v })}
                        stringifier={Util.nToS}
                        options={MIM.residueOptions(compounds, this.state.chainNameOne)} />
                    <EdgeLField
                        id='mol-in-bi-edge-one'
                        label='Edge'
                        style='above'
                        value={this.state.edgeOne}
                        updateNotifier={v => this.setState({ ...this.state, edgeOne: v })}
                        options={EdgeOptions} />
                    <ChainLField
                        id='mol-in-bi-chain-two'
                        label='Chain'
                        style='above'
                        value={this.state.chainNameTwo}
                        updateNotifier={v => {
                            let update: Partial<State> = {};
                            const c = compounds.find(c => c.chain.name === v);
                            if (c === undefined)
                                update = { ...update, chainNameTwo: undefined, residueNoTwo: undefined }
                            else {
                                update = { ...update, chainNameTwo: c.chain.name };
                                if (this.state.residueNoTwo === undefined || !Num.within(c.firstResidue().number, c.lastResidue().number, this.state.residueNoTwo))
                                    update = { ...update, residueNoTwo: c.firstResidue().number };
                            }
                            this.setState({ ...this.state, ...update });
                        }}
                        options={MIM.chainOptions(this.props.ctxData)} />
                    <ResidueLField
                        id='mol-in-bi-res-no-two'
                        label='Residue'
                        style='above'
                        value={this.state.residueNoTwo}
                        updateNotifier={v => this.setState({ ...this.state, residueNoTwo: v })}
                        stringifier={Util.nToS}
                        options={MIM.residueOptions(compounds, this.state.chainNameTwo)} />
                    <EdgeLField
                        id='mol-in-bi-edge-two'
                        label='Edge'
                        style='above'
                        value={this.state.edgeTwo}
                        updateNotifier={v => this.setState({ ...this.state, edgeTwo: v })}
                        options={EdgeOptions} />
                    <OrientLField
                        id='mol-in-bi-orientation'
                        label='Orientation'
                        style='above'
                        value={this.state.orientation}
                        updateNotifier={v => this.setState({ ...this.state, orientation: v })}
                        options={OrientationOptions} />
                    <PushButton
                        className="pushbutton-common pushbutton-add"
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addBaseInteraction();
                        }} />
                </div>
                <ErrorBox
                    errors={this.state.errors} />
                <AddedTable
                    className='mol-in-bi-added spaced-grid'
                    valuesKey='mol-in-bi-added'
                    columns={[
                        {caption: 'Chain', k: 'chainNameOne', stringify: (v, _i) => { const c = compounds.find(c => c.chain.name === v); return c ? Util.chainToString(c.chain) : 'N/A' }},
                        {caption: 'Residue', k: 'residueNoOne', stringify: (v, i) => {
                            const c = compounds.find(c => c.chain.name === i.chainNameOne);
                            if (!c) return 'N/A';
                            const res = c.residueByNumber(v);
                            return res ? Util.resNumToString(res) : 'N/A';
                        }},
                        {caption: 'Edge', k: 'edgeOne', stringify: v => EdgeInteraction.toString(v)},
                        {caption: 'Chain', k: 'chainNameTwo', stringify: (v, _i) => { const c = compounds.find(c => c.chain.name === v); return c ? Util.chainToString(c.chain) : 'N/A' }},
                        {caption: 'Residue', k: 'residueNoTwo', stringify: (v, i) => {
                            const c = compounds.find(c => c.chain.name === i.chainNameTwo);
                            if (!c) return 'N/A';
                            const res = c.residueByNumber(v);
                            return res ? Util.resNumToString(res) : 'N/A';
                        }},
                        {caption: 'Edge', k: 'edgeTwo', stringify: v => EdgeInteraction.toString(v)},
                        {caption: 'Orientation', k: 'orientation'}]}
                    hideHeader={true}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace BaseInteractionsInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}