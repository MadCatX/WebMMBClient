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
import { JsonCommands } from '../mmb/commands';
import { JsonCommandsDeserializer } from '../mmb/commands-deserializer';
import { ParameterNames } from '../mmb/available-parameters';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { GlobalConfig } from '../model/global-config';
import { NtC } from '../model/ntc';
import { NtCConformation } from '../model/ntc-conformation';
import { Reporting } from '../model/reporting';

export namespace MmbInputModel {
    export type ErrorKeys = 'mol-in-no-name' | 'mol-adv-params';
    export type ValueKeys = 'mol-in-cp-added' | 'mol-in-dh-added' | 'mol-in-bi-added' | 'mol-in-ntcs-added' |
        'mol-in-gp-reporting-interval' | 'mol-in-gp-num-reports' | 'mol-in-gp-temperature' | 'mol-in-gp-bisf' | 'mol-in-gp-def-md-params' | 'mol-in-gp-stage' |
        'mol-in-job-name' |
        'mol-in-raw-commands' |
        'mol-adv-params';
    export type AdvParams = Map<AVP.ParameterNames, unknown>;
    export type ValueTypes = BaseInteraction[] | Compound[] | DoubleHelix[] | NtCConformation[] | string[] | AdvParams;
    export type V<T> = FormModel.V<T>;
    export type Errors = FormModel.Errors<ErrorKeys>;
    export type Values = FormModel.Values<ValueKeys, ValueTypes>;
    export type UiMode = 'simple' | 'advanced' | 'maverick';

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

    export function defaultSetupValues() {
        const map = new Map<ValueKeys, V<ValueTypes>>();

        map.set('mol-in-gp-bisf', GlobalConfig.Defaults.baseInteractionScaleFactor);
        map.set('mol-in-gp-temperature', GlobalConfig.Defaults.temperature);
        map.set('mol-in-gp-reporting-interval', Reporting.Defaults.interval);
        map.set('mol-in-gp-num-reports', Reporting.Defaults.count);
        map.set('mol-in-gp-stage', 1);

        return map;
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

    export function jsonCommandsToValues(name: string, stages: number[], commands: JsonCommands) {
        const map = new Map<ValueKeys, V<ValueTypes>>();

        const global = JsonCommandsDeserializer.toGlobal(commands);
        const stage = stages[stages.length - 1];
        const md = JsonCommandsDeserializer.toMdParams(commands);
        const compounds = JsonCommandsDeserializer.toCompounds(commands);
        const doubleHelices = JsonCommandsDeserializer.toDoubleHelices(commands);
        const baseInteractions = JsonCommandsDeserializer.toBaseInteractions(commands);
        const ntcs = JsonCommandsDeserializer.toNtCs(commands);
        const rep = JsonCommandsDeserializer.toReporting(commands);
        const advParams = (() => {
            const obj = JsonCommandsDeserializer.toAdvancedParameters(commands);
            const map = new Map<ParameterNames, unknown>();

            for (const prop in obj) {
                map.set(prop as ParameterNames, obj[prop]);
            }
            return map;
        })();

        // Global
        map.set('mol-in-gp-reporting-interval', rep.interval);
        map.set('mol-in-gp-num-reports', rep.count);
        map.set('mol-in-gp-bisf', global.baseInteractionScaleFactor);
        map.set('mol-in-gp-temperature', global.temperature);
        map.set('mol-in-gp-def-md-params', md.useDefaults);
        map.set('mol-in-gp-stage', stage);
        map.set('mol-in-cp-added', compounds);
        map.set('mol-in-bi-added', baseInteractions);
        map.set('mol-in-dh-added', doubleHelices);
        map.set('mol-in-ntcs-added', ntcs);
        map.set('mol-adv-params', advParams);
        map.set('mol-in-job-name', name);

        return map;
    }

    export function rawCommandsToValues(name: string, stages: number[], raw_commands: string) {
        const map = defaultSetupValues();

        const stage = stages[stages.length - 1];

        map.set('mol-in-gp-stage', stage);
        map.set('mol-in-job-name', name);

        map.set('mol-in-raw-commands', raw_commands);

        return map;
    }
}
