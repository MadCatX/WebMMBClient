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
import { GComboBox } from './common/form/combo-box';
import { FormBlock } from './common/form/form-block';
import { Util } from './common/util';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { EdgeInteraction } from '../model/edge-interaction';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { Orientation } from '../model/orientation';
import { FormUtil } from '../model/common/form';
import { Manip } from '../util/manip';
import { Num } from '../util/num';

const EdgeOptions = EdgeInteraction.Edges.map((e) => {
    const o: GComboBox.Option = {value: e, caption: EdgeInteraction.toString(e)};
    return o;
});
const OrientationOptions = Orientation.Orientations.map((v) => {
    const o: GComboBox.Option = {value: v, caption: v};
    return o;
});

const FU = new FormUtil<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();
const AddedTable = MIM.TWDR<BaseInteraction[]>();

const ChainLField = LabeledField.ComboBox<string>();
const ResidueLField = LabeledField.ComboBox<number>();
const EdgeLField = LabeledField.ComboBox<EdgeInteraction.Edge>();
const OrientLField = LabeledField.ComboBox<Orientation.Orientation>();

interface State {
    chainOne?: string;
    residueOne?: number;
    edgeOne?: EdgeInteraction.Edge;
    chainTwo?: string;
    residueTwo?: number;
    edgeTwo?: EdgeInteraction.Edge;
    orientation?: Orientation.Orientation;
    errors: string[];
}

export class BaseInteractionsInput extends FormBlock<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, BaseInteractionsInput.Props, State> {
    constructor(props: BaseInteractionsInput.Props) {
        super(props);

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        this.state = {
            chainOne: compounds.length > 0 ? compounds[0].chain : undefined,
            chainTwo: compounds.length > 0 ? compounds[0].chain : undefined,
            edgeOne: 'Watson-Crick',
            edgeTwo: 'Watson-Crick',
            orientation: 'Cis',
            errors: new Array<string>(),
        };
    }

    private addBaseInteraction() {
        if (this.state.chainOne === undefined || this.state.residueOne === undefined || this.state.edgeOne === undefined ||
            this.state.chainTwo === undefined || this.state.residueTwo === undefined || this.state.edgeTwo === undefined ||
            this.state.orientation === undefined)
            throw new Error('Incomplete base interaction definition');

        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (compounds.find(c => c.chain === this.state.chainOne) === undefined || compounds.find(c => c.chain === this.state.chainTwo) === undefined)
            throw new Error('Invalid chains');

        const errors = new Array<string>();
        if (this.state.residueOne === this.state.residueTwo && this.state.chainOne === this.state.chainTwo) {
            errors.push('Residue cannot interact with itself');
            this.setState({ ...this.state, errors });
            return;
        }

        const interactions = FU.getArray<BaseInteraction[]>(this.props.ctxData, 'mol-in-bi-added');
        const bi = new BaseInteraction(
            this.state.chainOne,
            this.state.residueOne,
            this.state.edgeOne,
            this.state.chainTwo,
            this.state.residueTwo,
            this.state.edgeTwo,
            this.state.orientation
        );

        if (interactions.find(e => e.equals(bi)) !== undefined)
            errors.push('Such base interaction already exists');

        if (errors.length > 0)
            this.setState({ ...this.state, errors });
        else {
            interactions.push(bi);
            this.setState({ ...this.state, errors: [] });
            FU.updateValues(this.props.ctxData, [{ key: 'mol-in-bi-added', value: interactions }]);
        }
    }

    componentDidUpdate() {
        const compounds = FU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');

        if (compounds.length < 1 && this.state.chainOne === undefined && this.state.chainTwo === undefined)
            return; // Do fuck all;

        if (compounds.length < 1 ||
            (compounds.find(c => c.chain === this.state.chainOne) === undefined ||
             compounds.find(c => c.chain === this.state.chainTwo) === undefined) &&
             (this.state.chainOne !== undefined || this.state.chainTwo !== undefined)
           ) {
            // Revert to empty statae
            this.setState({
                ...this.state,
                chainOne: undefined,
                residueOne: undefined,
                chainTwo: undefined,
                residueTwo: undefined,
                errors: new Array<string>(),
            });
            return;
        }

        let update: Partial<State> =  {};

        if (this.state.chainOne === undefined)
            update = { ...update, chainOne: compounds[0].chain };
        if (this.state.chainTwo === undefined)
            update = { ...update, chainTwo: compounds[0].chain };

        if (this.state.chainOne !== undefined && this.state.residueOne === undefined) {
            const def = MIM.defaultFirstResNo(compounds, this.state.chainOne);
            update = { ...update, residueOne: def };
        }
        if (this.state.chainTwo !== undefined && this.state.residueTwo === undefined) {
            const def = MIM.defaultFirstResNo(compounds, this.state.chainTwo);
            update = { ...update, residueTwo: def };
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
                        value={this.state.chainOne}
                        updateNotifier={v => {
                            let update: Partial<State> = { chainOne: v };
                            const c = compounds.find(c => c.chain === v);
                            if (c === undefined)
                                update = { ...update, residueOne: undefined }
                            else {
                                if (this.state.residueOne === undefined || !Num.within(c.firstResidueNo, c.lastResidueNo, this.state.residueOne))
                                    update = { ...update, residueOne: c.firstResidueNo, };
                            }

                            this.setState({ ...this.state, ...update });
                        }}
                        options={MIM.chainOptions(this.props.ctxData)} />
                    <ResidueLField
                        id='mol-in-bi-res-no-one'
                        label='Residue'
                        style='above'
                        value={this.state.residueOne}
                        updateNotifier={v => this.setState({ ...this.state, residueOne: v })}
                        stringifier={Util.nToS}
                        options={MIM.residueOptions(compounds, this.state.chainOne)} />
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
                        value={this.state.chainTwo}
                        updateNotifier={v => {
                            let update: Partial<State> = { chainTwo: v };
                            const c = compounds.find(c => c.chain === v);
                            if (c === undefined)
                                update = { ...update, residueTwo: undefined }
                            else {
                                if (this.state.residueTwo === undefined || !Num.within(c.firstResidueNo, c.lastResidueNo, this.state.residueTwo))
                                    update = { ...update, residueTwo: c.firstResidueNo, };
                            }

                            this.setState({ ...this.state, ...update });
                        }}
                        options={MIM.chainOptions(this.props.ctxData)} />
                    <ResidueLField
                        id='mol-in-bi-res-no-two'
                        label='Residue'
                        style='above'
                        value={this.state.residueTwo}
                        updateNotifier={v => this.setState({ ...this.state, residueTwo: v })}
                        stringifier={Util.nToS}
                        options={MIM.residueOptions(compounds, this.state.chainTwo)} />
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
                    formId={this.props.formId}
                    className='mol-in-bi-added spaced-grid'
                    valuesKey='mol-in-bi-added'
                    columns={[
                        {caption: 'Chain', k: 'chainOne'},
                        {caption: 'Residue', k: 'residueOne'},
                        {caption: 'Edge', k: 'edgeOne'},
                        {caption: 'Chain', k: 'chainTwo'},
                        {caption: 'Residue', k: 'residueTwo'},
                        {caption: 'Edge', k: 'edgeTwo'},
                        {caption: 'Orientation', k: 'orientation'}]}
                    ctxData={this.props.ctxData} />
            </div>
        );
    }
}

export namespace BaseInteractionsInput {
    export interface Props extends FormBlock.Props<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes> {
    }
}