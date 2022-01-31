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
import { Util } from '../common/util';
import { TableWithDeletableRows } from '../common/table-with-deletable-rows';
import { LabeledField } from '../common/controlled/labeled-field';
import { Compound } from '../../model/mmb/compound';
import { NtC } from '../../model/mmb/ntc';
import { Num } from '../../util/num';
import { Eraseable } from '../../util/types';

const AddedTable = TableWithDeletableRows<NtC.Conformation[]>();
const ChainLField = LabeledField.ComboBox<string>();
const ResidueLField = LabeledField.ComboBox<number>();
const NtCLField = LabeledField.ComboBox<NtC.Conformer>();
const NumLField = LabeledField.LineEdit<string>();

type Selection = {
    chainName: string;
    firstResNo: number;
    lastResNo: number;
}

interface State {
    selection: Selection|null;
    conformer: NtC.Conformer;
    forceScaleFactor: Eraseable<number>;
    errors: string[];
}

function viableCompounds(compounds: Compound[]) {
    return compounds.filter(c => c.residues.length > 1);
}

export class NtCsInput extends MmbSetupComponent<NtCsInput.Props, State> {
    constructor(props: NtCsInput.Props) {
        super(props);

        const initial = this.props.setup.compounds[0];
        const selection: Selection|null = initial && initial.residues.length > 1 ?
            {
                chainName: initial.chain.name,
                firstResNo: initial.firstResidue.number,
                lastResNo: initial.firstResidue.number + 1,
            } : null;

        this.state = {
            selection,
            conformer: 'AA00',
            forceScaleFactor: Eraseable.Set(props.setup.ntcForceScaleFactor),
            errors: new Array<string>(),
        };
    }

    private addNtC() {
        const sel = this.state.selection;
        if (!sel)
            return;

        const errors = new Array<string>();
        const ntc = new NtC.Conformation(sel.chainName, sel.firstResNo, sel.lastResNo, this.state.conformer);
        const ret = this.props.setup.add('ntcs', ntc);
        if (ret)
            errors.push(...ret);

        this.setState({ ...this.state, errors });
    }

    private fixupSelection(compounds: Compound[], sel: Selection): { changed: boolean, selection: Selection } {
        const c = compounds.find(c => c.chain.name === sel.chainName);
        if (!c) {
            const nc = compounds[0];
            return {
                changed: true,
                selection: {
                    chainName: nc.chain.name,
                    firstResNo: nc.firstResidue.number,
                    lastResNo: nc.firstResidue.number + 1,
                },
            };
        }

        let changed = false;
        if (sel.firstResNo > c.lastResidue.number) {
            sel.firstResNo = c.firstResidue.number;
            changed = true;
        }

        if (sel.lastResNo <= sel.firstResNo || sel.lastResNo > c.lastResidue.number) {
            sel.lastResNo = sel.firstResNo + 1;
            changed = true;
        }

        return { changed, selection: sel };
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

    private residueOptions(compounds: Compound[]) {
        const sel = this.state.selection;
        if (!sel)
            return { first: [], last: [] };

        const c = compounds.find(c => c.chain.name === sel.chainName);
        if (!c) {
            console.error(`Chain ${sel.chainName} was selected but not found in compounds. This is a bug`);
            return { first: [], last: [] };
        }

        return {
            first: MmbUtil.residueOptions(c, undefined, c.lastResidue.number - 1),
            last: MmbUtil.residueOptions(c, sel.firstResNo + 1),
        };
    }

    private setDefaultSelection(compounds: Compound[]) {
        const c = compounds[0];
        if (!c)
            throw new Error('Attempted to set default selection with no compounds');

        if (c.residues.length < 2)
            this.setState({ ...this.state, selection: null });
        else {
            this.setState(
                {
                    ...this.state,
                    selection: {
                        chainName: c.chain.name,
                        firstResNo: c.firstResidue.number,
                        lastResNo: c.lastResidue.number + 1,
                    },
                }
            );
        }
    }

    componentDidMount() {
        this.subscribe(this.props.setup.events.ntcs, () => {
            const compounds = viableCompounds(this.props.setup.compounds);
            if (compounds.length === 0)
                this.setState({ ...this.state, selection: null });
            else
                this.refresh(compounds);

        });
        this.subscribe(this.props.setup.events.ntcForceScaleFactor, factor => {
            this.setState({ ...this.state, forceScaleFactor: Eraseable.Set(factor) });
        });
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
        const { first, last } = this.residueOptions(compounds);

        return (
            <div className='section'>
                <div className='section-caption'>NtCs</div>
                <div className='mol-in-ntcs-input spaced-grid'>
                    <ChainLField
                        id='mol-in-ntcs-chain'
                        label='Chain'
                        style='above'
                        value={this.state.selection ? this.state.selection.chainName : undefined}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.chainName = v;
                                const { selection } = this.fixupSelection(compounds, sel);
                                this.setState({ ...this.state, selection });
                            }
                        }}
                        options={MmbUtil.chainOptions(compounds)}
                    />
                    <ResidueLField
                        id='mol-in-ntcs-first-res-no'
                        label='First residue'
                        style='above'
                        value={this.state.selection ? this.state.selection.firstResNo : undefined}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.firstResNo = v;
                                const { selection } = this.fixupSelection(compounds, sel);
                                this.setState({ ...this.state, selection });
                            }
                        }}
                        stringifier={Util.nToS}
                        options={first}
                    />
                    <ResidueLField
                        id='mol-in-ntcs-last-res-no'
                        label='Last residue'
                        style='above'
                        value={this.state.selection ? this.state.selection.lastResNo : undefined}
                        updateNotifier={v => {
                            const sel = this.state.selection;
                            if (sel) {
                                sel.lastResNo = v;
                                const { selection } = this.fixupSelection(compounds, sel);
                                this.setState({ ...this.state, selection });
                            }
                        }}
                        stringifier={Util.nToS}
                        options={last}
                    />
                    <NtCLField
                        id='mol-in-ntcs-ntc'
                        label='NtC'
                        style='above'
                        value={this.state.conformer}
                        updateNotifier={v => this.setState({ ...this.state, conformer: v })}
                        options={MmbUtil.AllNtCsOptions}
                    />
                    <PushButton
                        className="pushbutton-common pushbutton-add"
                        value="+"
                        onClick={() => this.addNtC()}
                    />
                </div>
                <NumLField
                    id='mol-in-ntcs-force-scale-factor'
                    label='Force scale factor'
                    style='above'
                    tooltip='NtCforceScaleFactor'
                    value={this.state.forceScaleFactor.erased ? '' : this.state.forceScaleFactor.asStr()}
                    updateNotifier={v => {
                        if (v === '')
                            this.setState({ ...this.state, forceScaleFactor: Eraseable.Erased() });
                        else {
                            const num = Num.parseIntStrict(v);
                            if (!isNaN(num)) {
                                const errors = this.props.setup.set('ntcForceScaleFactor', num);
                                if (errors)
                                    this.setState(({ ...this.state, errors: [...this.state.errors, ...errors] }));
                            }
                        }
                    }}
                />
                <ErrorBox errors={this.state.errors} />
                <AddedTable
                    className='mol-in-ntcs-added spaced-grid'
                    columns={[
                        {
                            caption: 'Chain',
                            k: 'chainName',
                            stringify: (v,_i) => {
                                const c = compounds.find(c => c.chain.name === v);
                                return c ? MmbUtil.chainToString(c.chain) : 'N/A';
                            },
                        },
                        {
                            caption: 'First residue',
                            k: 'firstResNo',
                            stringify: (v, i) => {
                                const c = compounds.find(c => c.chain.name === i.chainName);
                                if (!c)
                                    return 'N/A';
                                const res = c.residueByNumber(v);
                                return res ? MmbUtil.resNumToString(res) : 'N/A';
                            },
                        },
                        {
                            caption: 'Last residue',
                            k: 'lastResNo',
                            stringify: (v, i) => {
                                const c = compounds.find(c => c.chain.name === i.chainName);
                                if (!c)
                                    return 'N/A';
                                const res = c.residueByNumber(v);
                                return res ? MmbUtil.resNumToString(res) : 'N/A';
                            },
                        },
                        {
                            caption: 'NtC',
                            k: 'ntc',
                        },
                    ]}
                    data={this.props.setup.ntcs}
                    hideHeader={false}
                    onRemoveRow={idx => this.props.setup.removeAt('ntcs', idx)}
                />
            </div>
        );
    }
}

export namespace NtCsInput {
    export interface Props extends MmbSetupComponent.Props {
    }
}
