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
    constructor(readonly chainOne: string, readonly residueOne: number, readonly edgeOne: EdgeInteraction.Edge,
                readonly chainTwo: string, readonly residueTwo: number, readonly edgeTwo: EdgeInteraction.Edge,
                readonly orientation: Orientation.Orientation) {
        if (chainOne === chainTwo && residueOne === residueTwo)
            throw new Error('Residue cannot interact with itself');
    }

    equals(other: BaseInteraction) {
        return this.chainOne === other.chainOne &&
               this.residueOne === other.residueOne &&
               this.edgeOne === other.edgeOne &&
               this.chainTwo === other.chainTwo &&
               this.residueTwo === other.residueTwo &&
               this.orientation === other.orientation;
    }
}
