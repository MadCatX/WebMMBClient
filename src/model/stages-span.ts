export class StagesSpan {
    constructor(readonly first: number, readonly last: number) {
        if (first < 1)
            throw new Error('Invalid first stage value');
        if (last < first)
            throw new Error('Invalid last stage value');
    }
}
