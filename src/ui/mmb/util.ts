/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as AVP from '../../mmb/available-parameters';
import { ComboBoxModel } from '../../model/common/combo-box-model';
import { Chain, Compound, ResidueNumber } from '../../model/mmb/compound';
import { NtC } from '../../model/mmb/ntc';

export namespace Util {
    export type AdvParams = Map<AVP.ParameterNames, unknown>;
    export type UiMode = 'simple' | 'advanced' | 'maverick' | 'density-fit';
    export type JobType = 'standard' | 'density-fit';

    export interface Props {
        jobId: string;
        jobName: string;
    }

    export const AllNtCsOptions = NtC.Conformers.map(c => {
        const o: ComboBoxModel.Option<NtC.Conformer> = { value: c, caption: c };
        return o;
    });

    export function chainOptions(compounds: Compound[]) {
        const chains = new Array<ComboBoxModel.Option<string>>();
        compounds.forEach(c => chains.push({value: c.chain.name, caption: chainToString(c.chain)}));
        return chains;
    }

    export function chainToString(chain: Chain) {
        if (chain.name === chain.authName)
            return chain.name;
        return `${chain.name} (${chain.authName})`;
    }

    export function defaultFirstResNo(compounds: Compound[], chainName: string): number|undefined {
        const c = compounds.find(i => i.chain.name, chainName);
        if (c === undefined)
            return undefined;
        return c.firstResidue.number;
    }

    export function defaultFirstResNoRev(compounds: Compound[], chainName: string): number|undefined {
        const c = compounds.find(i => i.chain.name, chainName);
        if (c === undefined)
            return undefined;
        return c.firstResidue.number;
    }

    export function resNumToString(resNum: ResidueNumber) {
        if (resNum.number === resNum.authNumber)
            return `${resNum.number}`;
        return `${resNum.number} (${resNum.authNumber})`;
    }

    export function residueOptions(compound: Compound, start?: number, stop?: number) {
        let num = start !== undefined ? start : compound.firstResidue.number;
        if (num < compound.firstResidue.number || num > compound.lastResidue.number)
            throw new Error(`Invalid start residue number ${num}`);
        const numTo = stop !== undefined ? stop : compound.lastResidue.number;
        if (numTo > compound.lastResidue.number || numTo < num)
            throw new Error(`Invalid stop residue number ${num}`);

        const options = new Array<ComboBoxModel.Option<number>>();
        for (;num <= numTo; num++) {
            const res = compound.residueByNumber(num);
            options.push({ value: res.number, caption: resNumToString(res) });
        }
        return options;
    }

    export function residueOptionsRev(compound: Compound, start?: number, stop?: number) {
        let num = start !== undefined ? start : compound.lastResidue.number;
        if (num > compound.lastResidue.number || num < compound.firstResidue.number)
            throw new Error(`Invalid start residue number ${num}`);
        const numTo = stop !== undefined ? stop : compound.firstResidue.number;
        if (numTo < compound.firstResidue.number || numTo > num)
            throw new Error(`Invalid stop residue number ${num}`);

        const options = new Array<ComboBoxModel.Option<number>>();
        for (;num >= numTo; num--) {
            const res = compound.residueByNumber(num);
            options.push({ value: res.number, caption: resNumToString(res) });
        }
        return options;
    }
}
