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
