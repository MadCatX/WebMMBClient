/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export namespace EdgeInteraction {
    export const Edges = [ 'WatsonCrick', 'SugarEdge' ];
    export type Edge = typeof Edges[number];

    export function isEdge(e: string): e is Edge {
        return Edges.includes(e as Edge);
    }

    export function toString(e: Edge) {
        switch (e) {
        case 'WatsonCrick':
            return 'Watson-Crick';
        case 'SugarEdge':
            return 'Sugar edge';
        }

        throw new Error('Unreachable');
    }
}
