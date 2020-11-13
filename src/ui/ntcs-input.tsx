import * as React from 'react';
import { FormContextManager as FCM } from './form-context-manager';
import { ErrorBox } from './common/error-box';
import { MmbInputUtil as MmbUtil, MMBFU } from './mmb-input-form-util';
import { LabeledField, GLabeledField } from './common/labeled-field';
import { PushButton } from './common/push-button';
import { Compound } from '../model/compound';
import { NtC } from '../model/ntc';
import { NtCConformation } from '../model/ntc-conformation';
import { GComboBox } from './common/combo-box';
import { FormBlock } from './common/form-block';

const AddedTable = MmbUtil.TWDR<NtCConformation[]>();
const StrLabeledField = LabeledField<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.Values, string>();
const NumLabeledField = LabeledField<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.Values, number>();
const NtCLabeledField = LabeledField<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.Values, NtC.Conformer>();

class NtCsInputInner extends FormBlock<NtCsInputInner.Props> {
    private addNtC(data: MmbUtil.ContextData) {
        const chain = MMBFU.maybeGetScalar<string>(data, 'mol-in-ntcs-chain');
        const firstResNo = MMBFU.maybeGetScalar<number>(data, 'mol-in-ntcs-first-res-no');
        const lastResNo = MMBFU.maybeGetScalar<number>(data, 'mol-in-ntcs-last-res-no');
        const cfrm = MMBFU.maybeGetScalar<NtC.Conformer>(data, 'mol-in-ntcs-ntc');

        if (chain === undefined || firstResNo === undefined || lastResNo === undefined || cfrm === undefined)
            return;

        const compounds = MMBFU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (MmbUtil.getCompound(compounds, chain) === undefined)
            return; // Ignore if either of the compounds does not exist

        const ntc = new NtCConformation(chain, firstResNo, lastResNo, cfrm);
        const ntcs = MMBFU.getArray<NtCConformation[]>(data, 'mol-in-ntcs-added');

        if (isNaN(firstResNo) || isNaN(lastResNo)) {
            MMBFU.updateErrors(this.props.ctxData, { key: 'mol-in-ntcs-errors', errors: [ 'Invalid residue numbers' ] });
            return;
        }
        if (lastResNo <= firstResNo) {
            MMBFU.updateErrors(this.props.ctxData, { key: 'mol-in-ntcs-errors', errors: [ 'Invalid last residue number' ] });
            return;
        }
        if (ntcs.find((e) => e.equals(ntc)) !== undefined) {
            MMBFU.updateErrors(this.props.ctxData, { key: 'mol-in-ntcs-errors', errors: [ 'Such NtC configuration already exists' ] });
            return;
        }

        ntcs.push(new NtCConformation(chain, firstResNo, lastResNo, cfrm));
        MMBFU.updateErrorsAndValues(data, [{ key: 'mol-in-ntcs-errors', errors: [] }], [{ key: 'mol-in-ntcs-added', value: ntcs }]);
    }

    componentDidUpdate(prevProps: NtCsInput.Props, prevState: {}, snapshot: any) {
        const compounds = MMBFU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        if (compounds.length === 0)
            return;

        const nv = MMBFU.emptyValues();

        let chain = MMBFU.maybeGetScalar<string>(this.props.ctxData, 'mol-in-ntcs-chain');
        if (chain === undefined) {
            chain = compounds[0].chain;
            nv.set('mol-in-ntcs-chain', chain);
        }
        const c = MmbUtil.getCompound(compounds, chain);
        if (c === undefined || c.residueCount < 2) {
            const firstResNo = MMBFU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-first-res-no') ?? NaN;
            const lastResNo = MMBFU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-last-res-no') ?? NaN;
            if (isNaN(firstResNo) && isNaN(lastResNo))
                return;
            nv.set('mol-in-ntcs-first-res-no', NaN);
            nv.set('mol-in-ntcs-last-res-no', NaN);
            this.props.ctxData.setValues(nv);
            return;
        }

        const firstResNo = MMBFU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-first-res-no') ?? NaN;
        const lastResNo = MMBFU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-last-res-no') ?? NaN;
        if (!isNaN(firstResNo) && firstResNo >= c.firstResidueNo && firstResNo <= c.lastResidueNo) {
            if (isNaN(lastResNo) || lastResNo <= firstResNo || lastResNo > c.lastResidueNo)
                nv.set('mol-in-ntcs-last-res-no', firstResNo + 1);
        } else {
            const def = MmbUtil.defaultFirstResNo(compounds, chain)!;
            nv.set('mol-in-ntcs-first-res-no', def);
            nv.set('mol-in-ntcs-last-res-no', def + 1);
        }

        if (MMBFU.maybeGetScalar<NtC.Conformer>(this.props.ctxData, 'mol-in-ntcs-ntc') === undefined)
            nv.set('mol-in-ntcs-ntc', MmbUtil.AllNtCsOptions[0].value);

        if (nv.size > 0)
            this.props.ctxData.setValues(nv);
    }

    render() {
        const compounds = MMBFU.getArray<Compound[]>(this.props.ctxData, 'mol-in-cp-added');
        const chain = MMBFU.maybeGetScalar<string>(this.props.ctxData, 'mol-in-ntcs-chain');

        let firstResOpts: GComboBox.Option[] = [];
        let lastResOpts: GComboBox.Option[] = [];
        if (chain !== undefined) {
            const c = MmbUtil.getCompound(compounds, chain);

            if (c !== undefined && c.residueCount > 1) {
                firstResOpts = MmbUtil.residueOptions(compounds, chain, c.firstResidueNo, c.lastResidueNo - 1);
                const firstResNo = MMBFU.maybeGetScalar<number>(this.props.ctxData, 'mol-in-ntcs-first-res-no') ?? NaN;
                if (!isNaN(firstResNo) && firstResNo >= c.firstResidueNo && firstResNo <= c.lastResidueNo)
                    lastResOpts = MmbUtil.residueOptions(compounds, chain, firstResNo + 1);
                else
                    lastResOpts = MmbUtil.residueOptions(compounds, chain, c.firstResidueNo + 1);
            }
        }

        return (
            <div className="section">
                <div className="section-caption">NtCs</div>
                <div className="mol-in-ntcs-input">
                    <StrLabeledField
                        {...GLabeledField.tags('mol-in-ntcs-chain', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label='Chain'
                        position='above'
                        inputType='combo-box'
                        options={MmbUtil.chainOptions(this.props.ctxData)} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-ntcs-first-res-no', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label='First residue'
                        position='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={firstResOpts} />
                    <NumLabeledField
                        {...GLabeledField.tags('mol-in-ntcs-last-res-no', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label="Last residue"
                        position='above'
                        inputType='combo-box'
                        converter={parseInt}
                        options={lastResOpts} />
                    <NtCLabeledField
                        {...GLabeledField.tags('mol-in-ntcs-ntc', this.props.formId, ['labeled-field'])}
                        formId={this.props.formId}
                        label='NtC'
                        position='above'
                        inputType='combo-box'
                        options={MmbUtil.AllNtCsOptions} />
                    <PushButton
                        className="pushbutton-add"
                        value="+"
                        onClick={(e) => {
                            e.preventDefault();
                            this.addNtC(this.props.ctxData);
                        }} />
                </div>
                <ErrorBox
                    errors={this.props.ctxData.errors.get('mol-in-ntcs-errors') ?? new Array<string>()} />
                <AddedTable
                    formId={this.props.formId}
                    className='mol-in-ntcs-added'
                    valuesKey='mol-in-ntcs-added'
                    columns={[
                        {caption: 'Chain', k: 'chain'},
                        {caption: 'First residue', k: 'firstResidueNo'},
                        {caption: 'Last residue', k: 'lastResidueNo'},
                        {caption: 'NtC', k: 'ntc'}]} />
            </div>
        );
    }
}

export namespace NtCsInputInner {
    export interface Props extends FormBlock.Props {
        ctxData: MmbUtil.ContextData;
    }
}

export class NtCsInput extends FormBlock<NtCsInput.Props> {
    render() {
        const CC = FCM.getContext(this.props.formId).Consumer;

        return (
            <CC>
                {(data: MmbUtil.ContextData) =>
                    <NtCsInputInner {...this.props} ctxData={data} />
                }
            </CC>
        );
    }
}

export namespace NtCsInput {
    export interface Props extends FormBlock.Props {
    }
}
