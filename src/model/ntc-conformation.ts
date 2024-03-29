/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { NtC } from './ntc';

export const DefaultNtCForceScaleFactor = 3000;

export class NtCConformation {
    constructor(readonly chainName: string, readonly firstResidueNo: number, readonly lastResidueNo: number, readonly ntc: NtC.Conformer) {
        if (lastResidueNo <= firstResidueNo)
            throw new Error('NtC conformer span must be at least two residues long and in ascending order');
    }

    equals(other: NtCConformation) {
        return this.chainName === other.chainName &&
               this.firstResidueNo === other.firstResidueNo &&
               this.lastResidueNo === other.lastResidueNo &&
               this.ntc === other.ntc;
    }
}

export class NtCs {
    constructor(readonly conformations: NtCConformation[], readonly forceScaleFactor: number) {
        if (forceScaleFactor < 0)
            throw new Error('Force scale factor must be non-negative');
    }

    static empty() {
        return new NtCs([], DefaultNtCForceScaleFactor);
    }
}
