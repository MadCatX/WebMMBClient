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
import { LabeledField } from '../common/controlled/labeled-field';
import { TableWithDeletableRows } from '../common/table-with-deletable-rows';
import { PushButton } from '../common/push-button';
import { Util } from '../common/util';
import { ComboBoxModel } from '../../model/common/combo-box-model';
import { Compound } from '../../model/mmb/compound';
import { DoubleHelix } from '../../model/mmb/double-helix';

const AddedTable = TableWithDeletableRows<DoubleHelix[]>();
const ChainLField = LabeledField.ComboBox<string>();
const ResidueLField = LabeledField.ComboBox<number>();

function viableCompounds(compounds: Compound[]) {
    return compounds.filter(c => c.residues.length > 1);
}

type Selection = {
    chainNameA: string;
    firstResNoA: number;
    lastResNoA: number;
    chainNameB: string;
    firstResNoB: number;
}

interface State {
    selection: Selection|null;
    errors: string[];
}

export class DoubleHelicesInput extends MmbSetupComponent<DoubleHelicesInput.Props, State> {
    constructor(props: DoubleHelicesInput.Props) {
        super(props);

        const initial = this.props.setup.compounds[0];
        const selection = initial ?
            {
                chainNameA: initial.chain.name,
                chainNameB: initial.chain.name,
                firstResNoA: initial.firstResidue.number,
                lastResNoA: initial.firstResidue.number,
                firstResNoB: initial.lastResidue.number,
            } : null;

        this.state = {
            selection,
            errors: new Array<string>(),
        };
    }

    private addDoubleHelix() {
        const errors = new Array<string>();
        if (!this.state.selection) {
            this.setState({ ...this.state, errors: [ 'Selection is empty' ]});
            return;
        }

        const sel = this.state.selection;
        const lastB = sel.firstResNoB - (sel.lastResNoA - sel.firstResNoA);
        const dh = new DoubleHelix(
            sel.chainNameA, sel.firstResNoA, sel.lastResNoA,
            sel.chainNameB, sel.firstResNoB, lastB
        );

        const ret = this.props.setup.add('doubleHelices', dh);
        if (ret)
            errors.push(...ret);

        this.setState({ ...this.state, errors });
    }

    private changeChainA(name: string) {
        if (this.state.selection === null)
            throw new Error('First chain changed with no valid selection');

        const c = this.props.setup.compounds.find(c => c.chain.name === name);
        if (!c)
            throw new Error(`Chain ${name} does not exist in compounds`);

        return {
            ...this.state.selection,
            chainNameA: name,
            firstResNoA: c.firstResidue.number,
            lastResNoA: c.lastResidue.number,
        };
    }

    private changeChainB(name: string) {
        if (this.state.selection === null)
            throw new Error('Second chain changed with no valid selection');

        const c = this.props.setup.compounds.find(c => c.chain.name === name);
        if (!c)
            throw new Error(`Chain ${name} does not exist in compounds`);

        return {
            ...this.state.selection,
            chainNameB: name,
            firstResNoB: c.lastResidue.number,
        };
    }

    private firstResNosA(compounds: Compound[]) {
        const sel = this.state.selection;
        if (!sel)
            return [];

        const c = compounds.find(c => c.chain.name === sel.chainNameA);
        if (!c) {
            console.error(`Chain ${sel.chainNameA} is selected as "A" but not found. This is a bug.`);
            return [];
        }

        const chop = (sel.chainNameA === sel.chainNameB) ? 1 : 0;
        return MmbUtil.residueOptions(c, undefined, c.lastResidue.number - chop);
    }

    private firstResNosB(compounds: Compound[]) {
        const sel = this.state.selection;
        if (!sel)
            return [];

        const c = compounds.find(c => c.chain.name === sel.chainNameB);
        if (!c) {
            console.error(`Chain ${sel.chainNameB} is selected as "B" but not found. This is a bug.`);
            return [];
        }

        const lastSelectable = this.lastSelectableResNoB(compounds, sel);
        return MmbUtil.residueOptionsRev(c, undefined, lastSelectable);
    }

    private fixupSelection(compounds: Compound[], sel: Selection): { changed: boolean, selection: Selection } {
        let changed = false;

        let haveA = false;
        let haveB = false;
        let cA = compounds[0];
        let cB = compounds[0];
        for (const c of compounds) {
            if (c.chain.name === sel.chainNameA) {
                cA = c;
                haveA = true;
            }
            if (c.chain.name === sel.chainNameB) {
                cB = c;
                haveB = true;
            }

            if (haveA && haveB)
                break;
        }

        if (!haveA) {
            sel = {
                ...sel,
                chainNameA: cA.chain.name,
                firstResNoA: cA.firstResidue.number,
                lastResNoA: cA.firstResidue.number,
            };
            changed = true;
        }
        if (!haveB) {
            sel = {
                ...sel,
                chainNameB: cB.chain.name,
                firstResNoB: cB.lastResidue.number,
            };
            changed = true;
        }

        const lastSelNoA = this.lastSelectableResNoA(cA, cB, sel);

        if (sel.lastResNoA > lastSelNoA) {
            sel.lastResNoA = lastSelNoA;
            changed = true;
        } else if (sel.firstResNoA > sel.lastResNoA) {
            sel.lastResNoA = sel.firstResNoA;
            changed = true;
        }

        if (sel.lastResNoA >= sel.firstResNoB && sel.chainNameA === sel.chainNameB) {
            sel.firstResNoB = cB.lastResidue.number;
            changed = true;
        }

        return { changed, selection: sel };
    }

    private lastResNosA(cA: Compound, cB: Compound) {
        const sel = this.state.selection;
        if (!sel)
            return [];

        const lastSelectable = this.lastSelectableResNoA(cA, cB, sel);
        return MmbUtil.residueOptions(cA, sel.firstResNoA, lastSelectable);
    }

    private lastResNoB() {
        const sel = this.state.selection;
        if (!sel)
            return undefined;
        return sel.firstResNoB - (sel.lastResNoA - sel.firstResNoA);
    }

    private lastSelectableResNoA(cA: Compound, cB: Compound, sel: Selection) {
        const lengthA = cA.residues.length;
        const lengthB = cB.residues.length;

        if (sel.chainNameA === sel.chainNameB) {
            const offset = sel.firstResNoA - 1; // Residue numbers start from 1
            return Math.floor((lengthA - offset) / 2) + offset;
        } else {
            const limitingLength = lengthA < lengthB ? lengthA : lengthB;
            const lastNo = sel.firstResNoA + limitingLength - 1;
            return lastNo >= lengthA ? lengthA : lastNo;
        }
    }

    private lastSelectableResNoB(compounds: Compound[], sel: Selection) {
        const cB = compounds.find(c => c.chain.name === sel.chainNameB);
        if (!cB)
            throw new Error('Attempted to get last selectable residues for non-existent chains');

        if (sel.chainNameA === sel.chainNameB) {
            return sel.lastResNoA + (sel.lastResNoA - sel.firstResNoA) + 1;
        } else {
            return sel.lastResNoA - sel.firstResNoA + 1;
        }
    }

    private refresh(compounds: Compound[]) {
        const sel = this.state.selection;
        if (sel) {
            const { changed, selection } = this.fixupSelection(compounds, sel);
            if (changed)
                this.setState({ ...this.state, selection });
            else
                this.forceUpdate(); // Deletions
        } else
            this.forceUpdate(); // Deletions
    }

    private setDefaultSelection(compounds: Compound[]) {
        // Dummy selection that will be adjusted during fixup
        const emptySelection = {
            chainNameA: '',
            firstResNoA: 0,
            lastResNoA: 0,
            chainNameB: '',
            firstResNoB: 0,
        };
        const { selection } = this.fixupSelection(compounds, emptySelection);

        this.setState({ ...this.state, selection });
    }

    componentDidMount() {
        this.subscribe(
            this.props.setup.events.doubleHelices,
            () => {
                const compounds = viableCompounds(this.props.setup.compounds);
                if (compounds.length === 0)
                    this.setState({ ...this.state, selection: null });
                else
                    this.refresh(compounds);
            }
        );
        this.subscribe(
            this.props.setup.events.compounds,
            cs => {
                const compounds = viableCompounds(cs);
                if (compounds.length === 0)
                    this.setState({ ...this.state, selection: null });
                else {
                    if (!this.state.selection)
                        this.setDefaultSelection(compounds);
                    else
                        this.refresh(compounds);
                }
            }
        );
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const compounds = viableCompounds(this.props.setup.compounds);

        let firstResNosA: ComboBoxModel.Option<number>[] = [];
        let lastResNosA: ComboBoxModel.Option<number>[] = [];
        let firstResNosB: ComboBoxModel.Option<number>[] = [];

        const sel = this.state.selection;
        if (sel) {
            let haveA = false;
            let haveB = false;
            let cA = compounds[0];
            let cB = compounds[0];
            for (const c of compounds) {
                if (c.chain.name === sel.chainNameA) {
                    cA = c;
                    haveA = true;
                }
                if (c.chain.name === sel.chainNameB) {
                    cB = c;
                    haveB = true;
                }

                if (haveA && haveB)
                    break;
            }

            if (!haveA)
                throw new Error(`Chain ${sel.chainNameA} was requested but not found in compounds`);
            if (!haveB)
                throw new Error(`Chain ${sel.chainNameB} was requested but not found in compounds`);

            firstResNosA = this.firstResNosA(compounds);
            lastResNosA = this.lastResNosA(cA, cB);
            firstResNosB = this.firstResNosB(compounds);
        }

        return (
            <div className='section'>
                <div className='section-caption'>Double helices</div>
                <div className='mol-in-dh-input spaced-grid'>
                    <ChainLField
                        id='first-res-one'
                        label='Chain'
                        style='above'
                        value={this.state.selection ? this.state.selection.chainNameA : undefined}
                        updateNotifier={v => {
                            const { selection } = this.fixupSelection(compounds, this.changeChainA(v));
                            this.setState({ ...this.state, selection });
                        }}
                        options={MmbUtil.chainOptions(compounds)}
                    />
                    <ResidueLField
                        id='first-res-one'
                        label='First residue'
                        style='above'
                        value={this.state.selection ? this.state.selection.firstResNoA : undefined}
                        stringifier={Util.nToS}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.firstResNoA = v;
                                const { selection } = this.fixupSelection(compounds, sel);
                                this.setState({ ...this.state, selection });
                            }
                        }}
                        options={firstResNosA} />
                    <ResidueLField
                        id='last-res-one'
                        label='Last residue'
                        style='above'
                        value={this.state.selection ? this.state.selection.lastResNoA : undefined}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.lastResNoA = v;
                                const { selection } = this.fixupSelection(compounds, sel);
                                this.setState({ ...this.state, selection });
                            }
                        }}
                        stringifier={Util.nToS}
                        options={lastResNosA}
                    />
                    <ChainLField
                        id='chain-two'
                        label='Chain'
                        style='above'
                        value={this.state.selection ? this.state.selection.chainNameB : undefined}
                        updateNotifier={v => {
                            const { selection } = this.fixupSelection(compounds, this.changeChainB(v));
                            this.setState({ ...this.state, selection });
                        }}
                        options={MmbUtil.chainOptions(compounds)} />
                    <ResidueLField
                        id='last-res-two'
                        label='First residue'
                        style='above'
                        value={this.state.selection ? this.state.selection.firstResNoB : undefined}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.firstResNoB = v;
                                const { selection } = this.fixupSelection(compounds, sel);
                                this.setState({ ...this.state, selection });
                            }
                        }}
                        stringifier={Util.nToS}
                        options={firstResNosB}
                    />
                    <div>
                        <div>Last residue</div>
                        <div>{this.lastResNoB()}</div>
                    </div>
                    <PushButton
                        className='pushbutton-common pushbutton-add'
                        value="+"
                        onClick={e => {
                            e.preventDefault();
                            this.addDoubleHelix();
                        }}
                    />
                </div>
                <ErrorBox
                    errors={this.state.errors} />
                <AddedTable
                    className='mol-in-dh-added spaced-grid'
                    data={this.props.setup.doubleHelices}
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
                            caption: 'First residue',
                            k: 'firstResNoA',
                            stringify: (v, i) => {
                                const c = compounds.find(c => c.chain.name === i.chainNameA);
                                if (!c)
                                    return 'N/A';
                                const res = c.residueByNumber(v);
                                return res ? MmbUtil.resNumToString(res) : 'N/A';
                            },
                        },
                        {
                            caption: 'Last residue',
                            k: 'lastResNoA',
                            stringify: (v, i) => {
                                const c = compounds.find(c => c.chain.name === i.chainNameA);
                                if (!c)
                                    return 'N/A';
                                const res = c.residueByNumber(v);
                                return res ? MmbUtil.resNumToString(res) : 'N/A';
                            },
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
                            caption: 'First residue',
                            k: 'firstResNoB',
                            stringify: (v, i) => {
                                const c = compounds.find(c => c.chain.name === i.chainNameB);
                                if (!c)
                                    return 'N/A';
                                const res = c.residueByNumber(v);
                                return res ? MmbUtil.resNumToString(res) : 'N/A';
                            },
                        },
                        {
                            caption: 'Last residue',
                            k: 'lastResNoB',
                            stringify: (v, i) => {
                                const c = compounds.find(c => c.chain.name === i.chainNameB);
                                if (!c)
                                    return 'N/A';
                                const res = c.residueByNumber(v);
                                return res ? MmbUtil.resNumToString(res) : 'N/A';
                            },
                        },
                    ]}
                    hideHeader={true}
                    onRemoveRow={idx => this.props.setup.removeAt('doubleHelices', idx) }
                />
            </div>
        );
    }
}

export namespace DoubleHelicesInput {
    export interface Props extends MmbSetupComponent.Props {
    }
}
