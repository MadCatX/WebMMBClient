
export namespace Orientation {
    export const Orientations = [ 'Cis', 'Trans' ];
    export type Orientation = typeof Orientations[number];

    export function isOrientation(o: string): o is Orientation {
        return Orientations.includes(o as Orientation);
    }
}
