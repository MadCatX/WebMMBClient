/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { EdgeInteraction } from './edge-interaction';
import { Orientation } from './orientation';

export class BaseInteraction {
    constructor(readonly chainNameOne: string, readonly residueNoOne: number, readonly edgeOne: EdgeInteraction.Edge,
                readonly chainNameTwo: string, readonly residueNoTwo: number, readonly edgeTwo: EdgeInteraction.Edge,
                readonly orientation: Orientation.Orientation) {
        if (chainNameOne === chainNameTwo && residueNoOne === residueNoTwo)
            throw new Error('Residue cannot interact with itself');
    }

    equals(other: BaseInteraction) {
        return this.chainNameOne === other.chainNameOne &&
               this.residueNoOne === other.residueNoOne &&
               this.edgeOne === other.edgeOne &&
               this.chainNameTwo === other.chainNameTwo &&
               this.residueNoTwo === other.residueNoTwo &&
               this.edgeTwo === other.edgeTwo &&
               this.orientation === other.orientation;
    }
}
