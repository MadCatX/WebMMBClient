/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export class DoubleHelix {
    constructor(readonly chainNameOne: string, readonly firstResidueNoOne: number, readonly lastResidueNoOne: number,
                readonly chainNameTwo: string, readonly firstResidueNoTwo: number, readonly lastResidueNoTwo: number) {
        if (firstResidueNoOne > lastResidueNoOne)
            throw new Error('Last residue on the first chain must be greater or equal than first residue');
        if (firstResidueNoTwo < lastResidueNoTwo)
            throw new Error('First residue on the second chain must be greater or equal than last residue');

        if (chainNameOne === chainNameTwo && lastResidueNoOne >= lastResidueNoTwo)
            throw new Error('Interacting parts of the same chain cannot overlap');

    }

    equals(other: DoubleHelix) {
        return this.chainNameOne === other.chainNameOne &&
               this.firstResidueNoOne === other.firstResidueNoOne &&
               this.lastResidueNoOne === other.lastResidueNoOne &&
               this.chainNameTwo === other.chainNameTwo &&
               this.firstResidueNoTwo === other.firstResidueNoTwo &&
               this.lastResidueNoTwo === other.lastResidueNoTwo;
    }
}
