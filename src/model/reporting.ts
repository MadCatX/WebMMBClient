export class Reporting {
    constructor(readonly interval: number, readonly count: number) {
        if (interval <= 0)
            throw new Error('Invalid reporting interval');
        if (count < 1)
            throw new Error('Invalid report count');
    }

    static readonly Defaults = {
        interval: 3,
        count: 1,
    }
}
