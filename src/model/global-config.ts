export class GlobalConfig {
    constructor(readonly baseInteractionScaleFactor: number,
                readonly useMultithreading: boolean,
                readonly temperature: number) {
        if (this.baseInteractionScaleFactor <= 0)
            throw new Error('Invalid baseInteractionScaleFactor');
    }

    static readonly Defaults = {
        baseInteractionScaleFactor: 200,
        temperature: 10,
    }
}
