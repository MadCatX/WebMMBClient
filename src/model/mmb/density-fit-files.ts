/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for defails.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';
import { DensityFitFile } from './density-fit-file';

export class DensityFitFiles implements Comparable, Cloneable {
    constructor(public structure: DensityFitFile|null, public densityMap: DensityFitFile|null) {
    }

    private fileEqual(a: DensityFitFile|null, b: DensityFitFile|null) {
        if (a) {
            if (b)
                return a.equals(b);
            else
                return false;
        } else {
            if (b)
                return false;
        }
        return true;
    }

    clone() {
        const structure = this.structure ? this.structure.clone() : null;
        const densityMap = this.densityMap ? this.densityMap.clone() : null;
        return new DensityFitFiles(structure, densityMap);
    }

    equals(other: DensityFitFiles) {
        return this.fileEqual(other.structure, this.structure) &&
               this.fileEqual(other.densityMap, this.densityMap);
    }
}
