/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { MmbSetupComponent } from './mmb-setup-component';
import { ErrorBox } from '../common/error-box';
import { PushButton } from '../common/push-button';
import { LabeledField } from '../common/controlled/labeled-field';
import { TableWithDeletableRows } from '../common/table-with-deletable-rows';
import { Util as MmbUtil } from './util';
import { Chain, Compound, ResidueNumber } from '../../model/mmb/compound';
import { Num } from '../../util/num';

const AddedTable = TableWithDeletableRows<Compound[]>();
const CpTypeLField = LabeledField.ComboBox<Compound.Type>();
const StrLField = LabeledField.LineEdit<string>();
const SeqLField = LabeledField.TextArea<string>();

interface State {
    chainName: string;
    chainAuthName: string;
    firstResidueNo: string;
    compoundType: Compound.Type;
    sequence: string;
    errors: string[];
}

export class CompoundsInput extends MmbSetupComponent<CompoundsInput.Props, State> {
    constructor(props: CompoundsInput.Props) {
        super(props);

        this.state = {
            chainName: '',
            chainAuthName: '',
            firstResidueNo: '1',
            compoundType: 'RNA',
            sequence: '',
            errors: new Array<string>(),
        };
    }

    private addCompound() {
        const errors = new Array<string>();

        const type = this.state.compoundType;
        const resNo = Num.parseIntStrict(this.state.firstResidueNo);
        if (isNaN(resNo))
            errors.push('First residue number is not a number');

        try {
            const chain = new Chain(
                this.state.chainName,
                this.state.chainAuthName.length > 0 ? this.state.chainAuthName : undefined
            );
            const seq = Compound.stringToSequence(this.state.sequence, type);
            const c = new Compound(type, chain, seq, resNo);

            const ret = this.props.setup.add('compounds', c);
            if (ret)
                errors.push(...ret);
        } catch (e) {
            errors.push((e as Error).toString());
        }

        this.setState({ ...this.state, errors });
    }

    private removeCompound(idx: number) {
        this.props.setup.removeAt('compounds', idx);
    }

    componentDidMount() {
        this.subscribe(
            this.props.setup.events.compounds,
            _c => {
                this.forceUpdate();
            }
        );
    }

    componentWillUnmount() {
        this.unsubscribeAll();
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
                        value={this.state.chainName}
                        updateNotifier={v => this.setState({ ...this.state, chainName: v })}
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
                            { value: 'protein', caption: 'Protein' },
                        ]} />
                    <SeqLField
                        label='Sequence'
                        style='above'
                        id='sequence'
                        value={this.state.sequence}
                        validator={v => Compound.stringIsSequence(v, this.state.compoundType)}
                        updateNotifier={v => this.setState({ ...this.state, sequence: v })}
                        hint='Enter sequence'
                        spellcheck={false}
                        resizeMode={'vertical'} />
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={_e => {
                            this.addCompound();
                        }} />
                </div>
                <ErrorBox
                    errors={this.state.errors} />
                <AddedTable
                    className='mol-in-cp-added spaced-grid'
                    onRemoveRow={idx => this.removeCompound(idx)}
                    columns={[
                        {
                            caption: 'Chain',
                            k: 'chain',
                            stringify: (v, _i) => MmbUtil.chainToString(v),
                        },
                        {
                            caption: 'First residue no.',
                            k: 'residues',
                            stringify: (v: ResidueNumber[], _i) => MmbUtil.resNumToString(v[0]),
                        },
                        {
                            caption: 'Type',
                            k: 'type'
                        },
                        {
                            caption: 'Sequence',
                            k: 'sequence',
                        },
                    ]}
                    data={this.props.setup.compounds}
                    hideHeader={true}
                />
            </div>
        );
    }
}

export namespace CompoundsInput {
    export interface Props extends MmbSetupComponent.Props {
    }
}
