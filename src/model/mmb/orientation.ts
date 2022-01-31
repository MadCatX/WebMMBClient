/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export namespace Orientation {
    export type Orientation = 'Cis' | 'Trans';
    export const Orientations: Orientation[] = [ 'Cis', 'Trans' ];

    export function isOrientation(o: string): o is Orientation {
        return Orientations.includes(o as Orientation);
    }
}
