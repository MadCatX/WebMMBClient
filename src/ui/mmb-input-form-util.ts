/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { FormUtil, FormUtilClass } from './common/form';
import { TableWithDeletableRows } from './common/table-with-deletable-rows';
import { GComboBox } from './common/combo-box';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { NtC } from '../model/ntc';
import { NtCConformation } from '../model/ntc-conformation';

export namespace MmbInputUtil {
    export type ErrorKeys = 'mol-in-cp-errors' | 'mol-in-dh-errors' | 'mol-in-bi-errors' | 'mol-in-ntcs-errors' | 'mol-in-commands-errors' | 'mol-in-no-name';
    export type ValueKeys = 'mol-in-cp-chain-id' | 'mol-in-cp-first-res-no' | 'mol-in-cp-sequence' | 'mol-in-cp-compound-type' |
        'mol-in-cp-added' |
        'mol-in-dh-chain-one' | 'mol-in-dh-first-res-no-one' | 'mol-in-dh-last-res-no-one' | 'mol-in-dh-chain-two' | 'mol-in-dh-first-res-no-two' | 'mol-in-dh-added' |
        'mol-in-bi-chain-one' | 'mol-in-bi-res-no-one' | 'mol-in-bi-edge-one' | 'mol-in-bi-chain-two' | 'mol-in-bi-res-no-two' | 'mol-in-bi-edge-two' | 'mol-in-bi-orientation' | 'mol-in-bi-added' |
        'mol-in-ntcs-chain' | 'mol-in-ntcs-first-res-no' | 'mol-in-ntcs-last-res-no' | 'mol-in-ntcs-ntc' | 'mol-in-ntcs-added' |
        'mol-in-gp-reporting-interval' | 'mol-in-gp-num-reports' | 'mol-in-gp-temperature' | 'mol-in-gp-bisf' | 'mol-in-gp-def-md-params' |
        'mol-in-commands' |
        'mol-in-job-name';
    export type ValueTypes = BaseInteraction[] | Compound[] | DoubleHelix[] | NtCConformation[] | string[];
    export type V<T> = FormUtil.V<T>;
    export type Errors = FormUtil.Errors<ErrorKeys>;
    export type Values = FormUtil.Values<ValueKeys, ValueTypes>;

    export interface Props extends FormUtil.Props<ValueKeys, ValueTypes> {
        jobName?: string;
    }

    export type ContextData = FormUtil.ContextData<ErrorKeys, ValueKeys, ValueTypes>;
    export type State = FormUtil.State<ErrorKeys, ValueKeys, ValueTypes>;

    export function TWDR<U extends ValueTypes & Array<any>>() {
        return TableWithDeletableRows<ErrorKeys, ValueKeys, ValueTypes, U>();
    }

    export const AllNtCsOptions = NtC.Conformers.map(c => {
        const s = NtC.conformerAsString(c)
        const o: GComboBox.Option = { value: s, caption: s };
        return o;
    });

    export function chainOptions(data: ContextData) {
        const compounds = (data.values.get('mol-in-cp-added') ?? new Array<Compound>()) as Compound[];
        const chains: GComboBox.Option[] = [];
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

    export function residueOptions(compounds: Compound[], chain: string, start?: number, stop?: number) {
        const seq = compounds.find(i => i.chain === chain);
        if (seq === undefined)
            return [];

        let num = start !== undefined ? start : seq.firstResidueNo;
        if (num < seq.firstResidueNo || num > seq.lastResidueNo)
            throw new Error(`Invalid start residue number ${num}`);
        const numTo = stop !== undefined ? stop : seq.lastResidueNo;
        if (numTo > seq.lastResidueNo || numTo < num)
            throw new Error(`Invalid stop residue number ${num}`);

        const options: GComboBox.Option[] = [];
        for (; num <= numTo; num++)
            options.push({ value: num.toString(), caption: num.toString() });
        return options;
    }

    export function residueOptionsRev(compounds: Compound[], chain: string, start?: number, stop?: number) {
        const seq = compounds.find(i => i.chain === chain);
        if (seq === undefined)
            return [];

        let num = start !== undefined ? start : seq.lastResidueNo;
        if (num > seq.lastResidueNo || num < seq.firstResidueNo)
            throw new Error(`Invalid start residue number ${seq}`);
        const numTo = stop !== undefined ? stop : seq.firstResidueNo;
        if (numTo < seq.firstResidueNo || numTo > num)
            throw new Error(`Invalid stop residue number ${seq}`);

        const options: GComboBox.Option[] = [];
        for (; num >= numTo; num--)
            options.push({ value: num.toString(), caption: num.toString() });
        return options;
    }
}


export class MMBFUClass extends FormUtilClass<MmbInputUtil.ErrorKeys, MmbInputUtil.ValueKeys, MmbInputUtil.ValueTypes> {}
export const MMBFU = new MMBFUClass();
