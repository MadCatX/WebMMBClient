/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { MmbSetupComponent } from './mmb-setup-component';
import { Util as MmbUtil } from './util';
import { ErrorBox } from '../common/error-box';
import { PushButton } from '../common/push-button';
import { TableWithDeletableRows } from '../common/table-with-deletable-rows';
import { LabeledField } from '../common/controlled/labeled-field';
import { Util } from '../common/util';
import { BaseInteraction } from '../../model/mmb/base-interaction';
import { Compound } from '../../model/mmb/compound';
import { EdgeInteraction } from '../../model/mmb/edge-interaction';
import { Orientation } from '../../model/mmb/orientation';
import { ComboBoxModel } from '../../model/common/combo-box-model';

const EdgeOptions = EdgeInteraction.Edges.map(e => {
    return { value: e, caption: EdgeInteraction.toString(e) } as ComboBoxModel.Option<EdgeInteraction.Edge>;
});
const OrientationOptions = Orientation.Orientations.map(v => {
    return { value: v, caption: v } as ComboBoxModel.Option<Orientation.Orientation>;
});

const AddedTable = TableWithDeletableRows<BaseInteraction[]>();
const ChainLField = LabeledField.ComboBox<string>();
const ResidueLField = LabeledField.ComboBox<number>();
const EdgeLField = LabeledField.ComboBox<EdgeInteraction.Edge>();
const OrientLField = LabeledField.ComboBox<Orientation.Orientation>();

type ResidueSelection = {
    chainNameA: string;
    resNoA: number;
    chainNameB: string;
    resNoB: number;
}

interface State {
    resSel: ResidueSelection|null;
    edgeA: EdgeInteraction.Edge;
    edgeB: EdgeInteraction.Edge;
    orientation: Orientation.Orientation;
    errors: string[];
}

export class BaseInteractionsInput extends MmbSetupComponent<BaseInteractionsInput.Props, State> {
    constructor(props: BaseInteractionsInput.Props) {
        super(props);

        const initial = this.props.setup.compounds[0];

        // @nocheckin: Figure out what is the FIXME below about
        // FIXME: Account for author residue numbering too! (This need to be done in more places)
        const resSel: ResidueSelection|null = initial ?
            {
                chainNameA: initial.chain.name,
                resNoA: initial.firstResidue.number,
                chainNameB: initial.chain.name,
                resNoB: initial.firstResidue.number,
            } : null;
        this.state = {
            resSel,
            edgeA: 'WatsonCrick',
            edgeB: 'WatsonCrick',
            orientation: 'Cis',
            errors: new Array<string>(),
        };
    }

    private addBaseInteraction() {
        const sel = this.state.resSel;
        if (!sel)
            return;

        const errors = new Array<string>();
        const bi = new BaseInteraction(
            sel.chainNameA,
            sel.resNoA,
            this.state.edgeA,
            sel.chainNameB,
            sel.resNoB,
            this.state.edgeB,
            this.state.orientation
        );

        const ret = this.props.setup.add('baseInteractions', bi);
        if (ret)
            errors.push(...ret);

        this.setState({ ...this.state, errors });
    }

    private fixupResidueSelection(compounds: Compound[], sel: ResidueSelection): { changed: boolean, resSel: ResidueSelection } {
        let changed = false;

        let haveA = false;
        let haveB = false;
        let cA = compounds[0];
        let cB = compounds[0];
        for (const c of compounds) {
            if (c.chain.name === sel.chainNameA) {
                haveA = true;
                cA = c;
            }

            if (c.chain.name === sel.chainNameB) {
                haveB = true;
                cB = c;
            }

            if (haveA && haveB)
                break;
        }

        if (!haveA) {
            sel.chainNameA = cA.chain.name;
            sel.resNoA = cA.firstResidue.number;
            changed = true;
        }
        if (!haveB) {
            sel.chainNameB = cB.chain.name;
            sel.resNoB = cB.firstResidue.number;
            changed = true;
        }

        if (sel.resNoA > cA.lastResidue.number) {
            sel.resNoA = cA.firstResidue.number;
            changed = true;
        }
        if (sel.resNoB > cB.lastResidue.number) {
            sel.resNoB = cB.firstResidue.number;
            changed = true;
        }

        return { changed, resSel: sel };
    }

    private defaultSelection() {
        const c = this.props.setup.compounds[0];
        if (!c)
            throw new Error('Attempted to set default selection with no compounds');

        return { name: c.chain.name, resNo: c.firstResidue.number };
    }

    private refresh() {
        const sel = this.state.resSel;
        if (sel) {
            const { changed, resSel } = this.fixupResidueSelection(this.props.setup.compounds, sel);
            if (changed)
                this.setState({ ...this.state, resSel });
            else
                this.forceUpdate(); // Deletions
        } else
            this.forceUpdate(); // Deletions
    }

    private residues(chainName: string) {
        const resSel = this.state.resSel;
        if (!resSel)
            return [];

        const c = this.props.setup.compounds.find(c => c.chain.name === chainName);
        if (!c) {
            console.error(`Chain ${chainName} was selected but not found in compounds`);
            return [];
        }

        return MmbUtil.residueOptions(c);
    }

    private setDefaultSelection() {
        const def = this.defaultSelection();

        this.setState(
            {
                ...this.state,
                resSel: {
                    chainNameA: def.name,
                    resNoA: def.resNo,
                    chainNameB: def.name,
                    resNoB: def.resNo,
                },
            }
        );
    }

    componentDidMount() {
        this.subscribe(this.props.setup.events.baseInteractions, () => {
            if (this.props.setup.compounds.length === 0)
                this.setState({ ...this.state, resSel: null });
            else
                this.refresh();
        });
        this.subscribe(
            this.props.setup.events.compounds,
            cs => {
                if (cs.length === 0)
                    this.setState({ ...this.state, resSel: null });
                else {
                    if (!this.state.resSel)
                        this.setDefaultSelection();
                    else
                        this.refresh();
                }
            }
        );
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const compounds = this.props.setup.compounds;

        const residuesA = this.state.resSel ? this.residues(this.state.resSel.chainNameA) : [];
        const residuesB = this.state.resSel ? this.residues(this.state.resSel.chainNameB) : [];

        return (
            <div className='section'>
                <div className='section-caption'>Base interactions</div>
                <div className='mol-in-bi-input spaced-grid'>
                    <ChainLField
                        id='mol-in-bi-chain-one'
                        label='Chain'
                        style='above'
                        value={this.state.resSel ? this.state.resSel.chainNameA : undefined}
                        updateNotifier={v => {
                            const sel = this.state.resSel;
                            if (sel) {
                                sel.chainNameA = v;
                                const { resSel } = this.fixupResidueSelection(compounds, sel);
                                this.setState({ ...this.state, resSel });
                            }
                        }}
                        options={MmbUtil.chainOptions(compounds)}
                    />
                    <ResidueLField
                        id='mol-in-bi-res-no-one'
                        label='Residue'
                        style='above'
                        value={this.state.resSel? this.state.resSel.resNoA : undefined}
                        updateNotifier={v => {
                            const sel = this.state.resSel;
                            if (sel) {
                                sel.resNoA = v;
                                const { resSel } = this.fixupResidueSelection(compounds, sel);
                                this.setState({ ...this.state, resSel });
                            }
                        }}
                        stringifier={Util.nToS}
                        options={residuesA}
                    />
                    <EdgeLField
                        id='mol-in-bi-edge-one'
                        label='Edge'
                        style='above'
                        value={this.state.edgeA}
                        updateNotifier={v => this.setState({ ...this.state, edgeA: v })}
                        options={EdgeOptions}
                    />
                    <ChainLField
                        id='mol-in-bi-chain-two'
                        label='Chain'
                        style='above'
                        value={this.state.resSel ? this.state.resSel.chainNameB : undefined}
                        updateNotifier={v => {
                            const sel = this.state.resSel;
                            if (sel) {
                                sel.chainNameB = v;
                                const { resSel } = this.fixupResidueSelection(compounds, sel);
                                this.setState({ ...this.state, resSel });

                            }
                        }}
                        options={MmbUtil.chainOptions(compounds)}
                    />
                    <ResidueLField
                        id='mol-in-bi-res-no-two'
                        label='Residue'
                        style='above'
                        value={this.state.resSel ? this.state.resSel.resNoB : undefined}
                        updateNotifier={v => {
                            const sel = this.state.resSel;
                            if (sel) {
                                sel.resNoB = v;
                                const { resSel } = this.fixupResidueSelection(compounds, sel);
                                this.setState({ ...this.state, resSel });
                            }
                        }}
                        stringifier={Util.nToS}
                        options={residuesB}
                    />
                    <EdgeLField
                        id='mol-in-bi-edge-two'
                        label='Edge'
                        style='above'
                        value={this.state.edgeB}
                        updateNotifier={v => this.setState({ ...this.state, edgeB: v })}
                        options={EdgeOptions}
                    />
                    <OrientLField
                        id='mol-in-bi-orientation'
                        label='Orientation'
                        style='above'
                        value={this.state.orientation}
                        updateNotifier={v => this.setState({ ...this.state, orientation: v })}
                        options={OrientationOptions}
                    />
                    <PushButton
                        className="pushbutton-common pushbutton-add"
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addBaseInteraction();
                        }}
                    />
                </div>
                <ErrorBox errors={this.state.errors} />
                <AddedTable
                    className='mol-in-bi-added spaced-grid'
                    columns={[
                        {
                            caption: 'Chain',
                            k: 'chainNameA',
                            stringify: (v, _i) => {
                                const c = compounds.find(c => c.chain.name === v);
                                return c ? MmbUtil.chainToString(c.chain) : 'N/A';
                            },
                        },
                        {
                            caption: 'Residue',
                            k: 'resNoA',
                            stringify: (v, i) => {
                                const c = compounds.find(c => c.chain.name === i.chainNameA);
                                if (!c)
                                    return 'N/A';
                                const res = c.residueByNumber(v);
                                return res ? MmbUtil.resNumToString(res) : 'N/A';
                            },
                        },
                        {
                            caption: 'Edge',
                            k: 'edgeA',
                            stringify: v => EdgeInteraction.toString(v as EdgeInteraction.Edge),
                        },
                        {
                            caption: 'Chain',
                            k: 'chainNameB',
                            stringify: (v, _i) => {
                                const c = compounds.find(c => c.chain.name === v);
                                return c ? MmbUtil.chainToString(c.chain) : 'N/A';
                            },
                        },
                        {
                            caption: 'Residue',
                            k: 'resNoB',
                            stringify: (v, i) => {
                                const c = compounds.find(c => c.chain.name === i.chainNameB);
                                if (!c)
                                    return 'N/A';
                                const res = c.residueByNumber(v);
                                return res ? MmbUtil.resNumToString(res) : 'N/A';
                            },
                        },
                        {
                            caption: 'Edge',
                            k: 'edgeB',
                            stringify: v => EdgeInteraction.toString(v),
                        },
                        {
                            caption: 'Orientation',
                            k: 'orientation',
                        },
                    ]}
                    data={this.props.setup.baseInteractions}
                    hideHeader={true}
                    onRemoveRow={idx => this.props.setup.removeAt('baseInteractions', idx)}
                />
            </div>
        );
    }
}

export namespace BaseInteractionsInput {
    export interface Props extends MmbSetupComponent.Props {
    }
}