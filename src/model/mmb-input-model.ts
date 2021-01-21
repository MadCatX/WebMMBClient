/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FormModel } from '../model/common/form';
import { TableWithDeletableRows } from '../ui/common/table-with-deletable-rows';
import { ComboBox } from '../model/common/combo-box';
import * as AVP from '../mmb/available-parameters';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { NtC } from '../model/ntc';
import { NtCConformation } from '../model/ntc-conformation';

export namespace MmbInputModel {
    export type ErrorKeys = 'mol-in-bi-errors' | 'mol-in-ntcs-errors' | 'mol-in-no-name' | 'mol-adv-params';
    export type ValueKeys = 'mol-in-cp-added' | 'mol-in-dh-added' |
        'mol-in-bi-chain-one' | 'mol-in-bi-res-no-one' | 'mol-in-bi-edge-one' | 'mol-in-bi-chain-two' | 'mol-in-bi-res-no-two' | 'mol-in-bi-edge-two' | 'mol-in-bi-orientation' | 'mol-in-bi-added' |
        'mol-in-ntcs-chain' | 'mol-in-ntcs-first-res-no' | 'mol-in-ntcs-last-res-no' | 'mol-in-ntcs-ntc' | 'mol-in-ntcs-added' |
        'mol-in-gp-reporting-interval' | 'mol-in-gp-num-reports' | 'mol-in-gp-temperature' | 'mol-in-gp-bisf' | 'mol-in-gp-def-md-params' | 'mol-in-gp-stage' |
        'mol-in-job-name' |
        'mol-adv-params';
    export type AdvParams = Map<AVP.ParameterNames, unknown>;
    export type ValueTypes = BaseInteraction[] | Compound[] | DoubleHelix[] | NtCConformation[] | string[] | AdvParams;
    export type V<T> = FormModel.V<T>;
    export type Errors = FormModel.Errors<ErrorKeys>;
    export type Values = FormModel.Values<ValueKeys, ValueTypes>;

    export interface Props extends FormModel.Props<ValueKeys, ValueTypes> {
        jobName?: string;
    }

    export type ContextData = FormModel.ContextData<ErrorKeys, ValueKeys, ValueTypes>;
    export type State = FormModel.State<ErrorKeys, ValueKeys, ValueTypes>;

    export function TWDR<U extends ValueTypes & Array<any>>() {
        return TableWithDeletableRows<ErrorKeys, ValueKeys, ValueTypes, U>();
    }

    export const AllNtCsOptions = NtC.Conformers.map(c => {
        const o: ComboBox.Option<NtC.Conformer> = { value: c, caption: c };
        return o;
    });

    export function chainOptions(data: ContextData) {
        const compounds = (data.values.get('mol-in-cp-added') ?? new Array<Compound>()) as Compound[];
        const chains = new Array<ComboBox.Option<string>>();
        compounds.forEach((comp) => chains.push({value: comp.chain, caption: comp.chain}));
        return chains;
    }

    export function defaultFirstResNo(compounds: Compound[], chain: string): number|undefined {
        const seq = compounds.find(i => i.chain === chain);
        if (seq === undefined)
            return undefined;
        return seq.firstResidueNo;
    }

    export function defaultFirstResNoRev(compounds: Compound[], chain: string): number|undefined {
        const seq = compounds.find(i => i.chain === chain);
        if (seq === undefined)
            return undefined;
        return seq.lastResidueNo;
    }

    export function getCompound(compounds: Compound[], chain: string) {
        return compounds.find(i => i.chain === chain);
    }

    export function residueOptions(compounds: Compound[], chain?: string, start?: number, stop?: number) {
        if (chain === undefined)
            return [];
        const seq = compounds.find(i => i.chain === chain);
        if (seq === undefined)
            return [];

        let num = start !== undefined ? start : seq.firstResidueNo;
        if (num < seq.firstResidueNo || num > seq.lastResidueNo)
            throw new Error(`Invalid start residue number ${num}`);
        const numTo = stop !== undefined ? stop : seq.lastResidueNo;
        if (numTo > seq.lastResidueNo || numTo < num)
            throw new Error(`Invalid stop residue number ${num}`);

        const options = new Array<ComboBox.Option<number>>();
        for (; num <= numTo; num++)
            options.push({ value: num, caption: num.toString() });
        return options;
    }

    export function residueOptionsRev(compounds: Compound[], chain?: string, start?: number, stop?: number) {
        if (chain === undefined)
            return [];
        const seq = compounds.find(i => i.chain === chain);
        if (seq === undefined)
            return [];

        let num = start !== undefined ? start : seq.lastResidueNo;
        if (num > seq.lastResidueNo || num < seq.firstResidueNo)
            throw new Error(`Invalid start residue number ${seq}`);
        const numTo = stop !== undefined ? stop : seq.firstResidueNo;
        if (numTo < seq.firstResidueNo || numTo > num)
            throw new Error(`Invalid stop residue number ${seq}`);

        const options = new Array<ComboBox.Option<number>>();
        for (; num >= numTo; num--)
            options.push({ value: num, caption: num.toString() });
        return options;
    }
}
