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
import { TableWithDeletableRows } from '../common/table-with-deletable-rows';
import { LabeledField } from '../common/controlled/labeled-field';
import { ErrorBox } from '../common/error-box';
import { PushButton } from '../common/push-button';
import { Util } from '../common/util';
import { ComboBoxModel } from '../../model/common/combo-box-model';
import { Compound } from '../../model/mmb/compound';
import { Mobilizer, ResidueSpan } from '../../model/mmb/mobilizer';

type AllItems = 'all-items';

const AddedTable = TableWithDeletableRows<Mobilizer[]>();
const BMLField = LabeledField.ComboBox<Mobilizer.BondMobility>();
const ChainLField = LabeledField.ComboBox<string | AllItems>();
const FResNoLField = LabeledField.ComboBox<number | AllItems>();
const LResNoLField = LabeledField.ComboBox<number>();

function rToS(v: number | AllItems | undefined) {
    if (v === undefined)
        return '';
    if (typeof v === 'string' && v === 'all-items')
        return 'all-items';
    else if (typeof v === 'number')
        return v.toString();
    throw new Error('Invalid value type');
}

type Selection = {
    chainName: string | AllItems;
    firstResNo: number | AllItems;
    lastResNo: number;
}

interface State {
    selection: Selection|null;
    bondMobility: Mobilizer.BondMobility;
    errors: string[];
}

export class MobilizersInput extends MmbSetupComponent<MobilizersInput.Props, State> {
    constructor(props: MobilizersInput.Props) {
        super(props);

        const initial = this.props.setup.compounds[0];
        const selection: Selection|null = initial ?
            {
                chainName: initial.chain.name,
                firstResNo: 'all-items',
                lastResNo: 1,
            } : null;

        this.state = {
            selection,
            bondMobility: 'Rigid',
            errors: new Array<string>(),
        };
    }

    private addMobilizer() {
        const sel = this.state.selection;
        if (!sel)
            return;

        const errors = new Array<string>();

        const span = (sel.chainName !== 'all-items' && sel.firstResNo !== 'all-items') ? new ResidueSpan(sel.firstResNo, sel.lastResNo) : undefined;
        const m = new Mobilizer(
            this.state.bondMobility,
            sel.chainName !== 'all-items' ? sel.chainName : undefined,
            span
        );
        const ret = this.props.setup.add('mobilizers', m);
        if (ret)
            errors.push(...ret);

        this.setState({ ...this.state, errors });
    }

    private firstResidueOptions() : ComboBoxModel.Option<number | 'all-items'>[] {
        const sel = this.state.selection;
        if (!sel)
            return [];

        if (sel.chainName === 'all-items')
            return [];

        const c = this.props.setup.compounds.find(c => c.chain.name === sel.chainName);
        if (!c) {
            console.error(`Chain ${sel.chainName} selected but not found in compounds`);
            return [];
        }

        return [
            { value: 'all-items', caption: 'All residues' },
            ...MmbUtil.residueOptions(c),
        ];
    }

    private fixupSelection(sel: Selection): { changed: boolean, selection: Selection } {
        if (sel.chainName === 'all-items')
            return { changed: false, selection: sel };

        const c = this.props.setup.compounds.find(c => c.chain.name === sel.chainName);
        if (!c) {
            return {
                changed: true,
                selection: {
                    chainName: 'all-items',
                    firstResNo: 'all-items',
                    lastResNo: 1,
                },
            };
        }

        let changed = false;

        if (sel.firstResNo !== 'all-items' && sel.firstResNo > c.lastResidue.number) {
            sel.firstResNo = 'all-items';
            sel.lastResNo = c.firstResidue.number,
            changed = true;
        }

        if (sel.firstResNo !== 'all-items' && sel.lastResNo < sel.firstResNo) {
            sel.lastResNo = sel.firstResNo;
            changed = true;
        }

        return { changed, selection: sel };
    }

    private lastResidueOptions() {
        const sel = this.state.selection;
        if (!sel)
            return [];

        if (sel.firstResNo === 'all-items')
            return [];

        const c = this.props.setup.compounds.find(c => c.chain.name === sel.chainName);
        if (!c) {
            console.error(`Chain ${sel.chainName} selected but not found in compounds`);
            return [];
        }

        return MmbUtil.residueOptions(c, sel.firstResNo);
    }

    private refresh() {
        const sel = this.state.selection;
        if (sel) {
            const { changed, selection } = this.fixupSelection(sel);
            if (changed)
                this.setState({ ...this.state, selection });
            else
                this.forceUpdate(); // Some mobilizer may have been deleted
        } else
            this.forceUpdate(); // Some mobilizer may have been deleted
    }

    private setDefaultSelection(compounds: Compound[]) {
        this.setState(
            {
                ...this.state,
                selection: {
                    chainName: 'all-items',
                    firstResNo: 'all-items',
                    lastResNo: compounds[0].firstResidue.number,
                }
            }
        );
    }

    componentDidMount() {
        this.subscribe(this.props.setup.events.mobilizers, () => {
            if (this.props.setup.compounds.length === 0)
                this.setState({ ...this.state, selection: null });
            else
                this.refresh();
        });
        this.subscribe(this.props.setup.events.compounds, cs => {
            if (cs.length === 0)
                this.setState({ ...this.state, selection: null });
            else {
                if (!this.state.selection)
                    this.setDefaultSelection(cs);
                else
                    this.refresh();
            }
        });
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const compounds = this.props.setup.compounds;

        return (
            <div className='section'>
                <div className='section-caption'>Mobilizers</div>
                <div className='mol-in-mobilizers-input spaced-grid'>
                    <BMLField
                        id='mobilizers-bond-mobility'
                        label='Bond mobility'
                        style='above'
                        value={this.state.bondMobility}
                        options={[
                            { value: 'Rigid', caption: 'Rigid' },
                            { value: 'Torsion', caption: 'Torsion' },
                            { value: 'Free', caption: 'Free' },
                        ]}
                        updateNotifier={v => this.setState({ ...this.state, bondMobility: v })}
                    />
                    <ChainLField
                        id='mobilizers-chain'
                        label='Chain'
                        style='above'
                        value={this.state.selection ? this.state.selection.chainName : undefined}
                        options={[{ value: 'all-items', caption: 'All chains' }, ...MmbUtil.chainOptions(compounds)]}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.chainName = v;
                                const { selection } = this.fixupSelection(sel);
                                this.setState({ ...this.state, selection });
                            }
                        }}
                    />
                    <FResNoLField
                        id='mobilizers-first-res-no'
                        label='First residue'
                        style='above'
                        value={this.state.selection ? this.state.selection.firstResNo : undefined}
                        options={this.firstResidueOptions()}
                        stringifier={rToS}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.firstResNo = v;
                                const { selection } = this.fixupSelection(sel);
                                this.setState({ ...this.state, selection });
                            }
                        }}
                    />
                    <LResNoLField
                        id='mobilizers-last-res-no'
                        label='Last residue'
                        style='above'
                        value={this.state.selection ? this.state.selection.lastResNo : undefined}
                        options={this.lastResidueOptions()}
                        stringifier={Util.nToS}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.lastResNo = v;
                                const { selection } = this.fixupSelection(sel)
                                this.setState({ ...this.state, selection });
                            }
                        }}
                    />
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={e => {
                            e.preventDefault();
                            this.addMobilizer();
                        }} />
                </div>
                <ErrorBox errors={this.state.errors} />
                <AddedTable
                    className='mol-in-mobilizers-added spaced-grid'
                    columns={[
                        {
                            caption: 'Bond mobility',
                            k: 'bondMobility',
                        },
                        {
                            caption: 'Chain',
                            k: 'chainName',
                            stringify: name => {
                                const c = compounds.find(c => c.chain.name === name);
                                return c ? MmbUtil.chainToString(c.chain) : 'N/A';
                            },
                        },
                        {
                            caption: 'Residue span',
                            k: 'residueSpan',
                            stringify: (v, i) => {
                                if (!v)
                                    return 'All residues';
                                const c = compounds.find(c => c.chain.name === i.chainName);
                                if (!c)
                                    return 'All residues';
                                if (i.residueSpan) {
                                    const first = c.residueByNumber(i.residueSpan.first);
                                    const last = c.residueByNumber(i.residueSpan.last);
                                    return (first !== undefined && last !== undefined) ? `${MmbUtil.resNumToString(first)} -> ${MmbUtil.resNumToString(last)}` : 'N/A';
                                }
                                return 'All residues';
                            },
                        },
                    ]}
                    data={this.props.setup.mobilizers}
                    hideHeader={true}
                    onRemoveRow={idx => this.props.setup.removeAt('mobilizers', idx)}
                />
            </div>
        );
    }
}

export namespace MobilizersInput {
    export interface Props extends MmbSetupComponent.Props {
    }
}

