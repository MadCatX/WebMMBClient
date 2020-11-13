import { NtC } from './ntc';

export class NtCConformation {
    constructor(readonly chain: string, readonly firstResidueNo: number, readonly lastResidueNo: number, readonly ntc: NtC.Conformer) {
        if (lastResidueNo <= firstResidueNo)
            throw new Error('NtC conformer span must be at least two residues long and in ascending order');
    }

    equals(other: NtCConformation) {
        return this.chain === other.chain &&
               this.firstResidueNo === other.firstResidueNo &&
               this.lastResidueNo === other.lastResidueNo &&
               this.ntc === other.ntc;
    }
}
