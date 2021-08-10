/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { parseCif } from './cif';

export namespace Structural {
    export type Chains = Map<string, number[]>;

    export interface Division {
        chains: Chains;
        authChains: Chains;
    }

    export async function cifToDivision(cif: string | File) : Promise<Division> {
        let data = '';
        if (typeof cif !== 'string')
            data = await cif.text();

        return parseCif(data);
    }

    export function pdbToDivision(pdb: string | File) {
        throw new Error('Unimplemented');
    }
}
