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
import { DensityFitCommands, StandardCommands } from '../mmb/api';
import { JsonCommandsDeserializer } from '../mmb/commands-deserializer';
import { ParameterNames } from '../mmb/available-parameters';
import { Util } from '../ui/common/util';
import { BaseInteraction } from './base-interaction';
import { Compound } from './compound';
import { DoubleHelix } from './double-helix';
import { GlobalConfig } from './global-config';
import { Mobilizer } from './mobilizer';
import { NtC } from './ntc';
import { NtCConformation } from './ntc-conformation';
import { Reporting } from './reporting';
import { AdditionalFile } from './additional-file';
import { DensityFitFile } from './density-fit-file';

export namespace MmbInputModel {
    export type ErrorKeys = 'mol-in-no-name' | 'mol-adv-params' | 'mol-raw';
    export type ValueKeys =
        'mol-in-cp-added' | 'mol-in-dh-added' | 'mol-in-bi-added' |
        'mol-in-ntcs-added' | 'mol-in-mobilizers-added' | 'mol-in-additional-files-added' |
        'mol-in-density-fit-files-added' |
        'mol-in-gp-reporting-interval' | 'mol-in-gp-num-reports' | 'mol-in-gp-temperature' | 'mol-in-gp-bisf' | 'mol-in-gp-def-md-params' | 'mol-in-gp-stage' |
        'mol-in-job-name' |
        'mol-in-raw-commands' |
        'mol-adv-params' |
        'mol-in-additional-files';
    export type AdvParams = Map<AVP.ParameterNames, unknown>;
    export type ValueTypes = BaseInteraction[] | Compound[] | DoubleHelix[] | NtCConformation[] | string[] | AdvParams | Mobilizer[] | AdditionalFile[] | DensityFitFile [];
    export type V<T> = FormModel.V<T>;
    export type Errors = FormModel.Errors<ErrorKeys>;
    export type Values = FormModel.Values<ValueKeys, ValueTypes>;
    export type UiMode = 'simple' | 'advanced' | 'maverick' | 'density-fit';
    export type JobType = 'standard' | 'density-fit';

    export interface Props extends FormModel.Props<ValueKeys, ValueTypes> {
        jobId: string;
        jobName: string;
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
        compounds.forEach(c => chains.push({value: c.chain.name, caption: Util.chainToString(c.chain)}));
        return chains;
    }

    export function densityFitCommandsToValues(commands: DensityFitCommands) {
        const map = defaultSetupValues();

        const densityFitFiles = JsonCommandsDeserializer.toDensityFitFiles(commands);
        const files: DensityFitFile[] = [];
        files.push(DensityFitFile.fromInfo('structure', densityFitFiles.structureFileName, null));
        files.push(DensityFitFile.fromInfo('density-map', densityFitFiles.densityMapFileName, null));

        const compounds = JsonCommandsDeserializer.toCompounds(commands);
        const mobilizers = JsonCommandsDeserializer.toMobilizers(commands);

        map.set('mol-in-density-fit-files-added', files);
        map.set('mol-in-cp-added', compounds);
        map.set('mol-in-mobilizers-added', mobilizers);

        return map;
    }

    export function defaultFirstResNo(compounds: Compound[], chainName: string): number|undefined {
        const c = compounds.find(i => i.chain.name, chainName);
        if (c === undefined)
            return undefined;
        return c.firstResidue().number;
    }

    export function defaultFirstResNoRev(compounds: Compound[], chainName: string): number|undefined {
        const c = compounds.find(i => i.chain.name, chainName);
        if (c === undefined)
            return undefined;
        return c.firstResidue().number;
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

    export function getCompound(compounds: Compound[], chainName: string) {
        return compounds.find(i => i.chain.name === chainName);
    }

    export function residueOptions(compounds: Compound[], chainName?: string, start?: number, stop?: number) {
        if (chainName === undefined)
            return [];
        const c = compounds.find(i => i.chain.name === chainName);
        if (c === undefined)
            return [];

        let num = start !== undefined ? start : c.firstResidue().number;
        if (num < c.firstResidue().number || num > c.lastResidue().number)
            throw new Error(`Invalid start residue number ${num}`);
        const numTo = stop !== undefined ? stop : c.lastResidue().number;
        if (numTo > c.lastResidue().number || numTo < num)
            throw new Error(`Invalid stop residue number ${num}`);

        const options = new Array<ComboBox.Option<number>>();
        for (;num <= numTo; num++) {
            const res = c.residueByNumber(num);
            options.push({ value: res.number, caption: Util.resNumToString(res) });
        }
        return options;
    }

    export function residueOptionsRev(compounds: Compound[], chainName?: string, start?: number, stop?: number) {
        if (chainName === undefined)
            return [];
        const c = compounds.find(i => i.chain.name === chainName);
        if (c === undefined)
            return [];

        let num = start !== undefined ? start : c.lastResidue().number;
        if (num > c.lastResidue().number || num < c.firstResidue().number)
            throw new Error(`Invalid start residue number ${c}`);
        const numTo = stop !== undefined ? stop : c.firstResidue().number;
        if (numTo < c.firstResidue().number || numTo > num)
            throw new Error(`Invalid stop residue number ${c}`);

        const options = new Array<ComboBox.Option<number>>();
        for (;num >= numTo; num--) {
            const res = c.residueByNumber(num);
            options.push({ value: res.number, caption: Util.resNumToString(res) });
        }
        return options;
    }

    export function jsonCommandsToValues(name: string, stages: number[], currentStage: number|null, commands: DensityFitCommands|StandardCommands, files: AdditionalFile[]) {
        const map = commands.job_type === 'DensityFit' ? densityFitCommandsToValues(commands) : standardCommandsToValues(commands, files);

        let stage = commands.job_type === 'DensityFit' ? 2 : 1;
        if (stages.length > 0) {
            if (currentStage) {
                if (!stages.includes(currentStage))
                    throw new Error('Invalid value of currentStage');
                stage = currentStage;
            }
        }
        const rep = JsonCommandsDeserializer.toReporting(commands);
        const global = JsonCommandsDeserializer.toGlobal(commands);

        map.set('mol-in-gp-stage', stage);
        map.set('mol-in-gp-reporting-interval', rep.interval);
        map.set('mol-in-gp-num-reports', rep.count);
        map.set('mol-in-gp-bisf', global.baseInteractionScaleFactor);
        map.set('mol-in-gp-temperature', global.temperature);
        map.set('mol-in-job-name', name);

        return map;
    }

    export function rawCommandsToValues(name: string, stages: number[], currentStage: number|null, raw_commands: string, files: AdditionalFile[]) {
        const map = defaultSetupValues();

        let stage = 1;
        if (stages.length > 0) {
            if (currentStage) {
                if (!stages.includes(currentStage))
                    throw new Error('Invalid value of currentStage');
                stage = currentStage;
            }
        }

        map.set('mol-in-gp-stage', stage);
        map.set('mol-in-job-name', name);
        map.set('mol-in-additional-files-added', files);

        map.set('mol-in-raw-commands', raw_commands);

        return map;
    }

    export function standardCommandsToValues(commands: StandardCommands, files: AdditionalFile[]) {
        const map = new Map<ValueKeys, V<ValueTypes>>();

        const md = JsonCommandsDeserializer.toMdParams(commands);
        const compounds = JsonCommandsDeserializer.toCompounds(commands);
        const doubleHelices = JsonCommandsDeserializer.toDoubleHelices(commands);
        const baseInteractions = JsonCommandsDeserializer.toBaseInteractions(commands);
        const ntcs = JsonCommandsDeserializer.toNtCs(commands);
        const mobilizers = JsonCommandsDeserializer.toMobilizers(commands);
        const advParams = (() => {
            const obj = JsonCommandsDeserializer.toAdvancedParameters(commands, files);
            const map = new Map<ParameterNames, unknown>();

            for (const prop in obj) {
                map.set(prop as ParameterNames, obj[prop]);
            }
            return map;
        })();

        map.set('mol-in-gp-def-md-params', md.useDefaults);
        map.set('mol-in-cp-added', compounds);
        map.set('mol-in-bi-added', baseInteractions);
        map.set('mol-in-dh-added', doubleHelices);
        map.set('mol-in-ntcs-added', ntcs);
        map.set('mol-in-mobilizers-added', mobilizers);
        map.set('mol-adv-params', advParams);
        map.set('mol-in-additional-files-added', files);

        return map;
    }
}
