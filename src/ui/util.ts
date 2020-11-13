function HasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop);
}

export namespace UiUtil {
    export function toString(value: any) {
        if (value === undefined)
            return '';
        if (typeof value === 'string')
            return value;
        if (typeof value === 'number')
            return value.toString();
        if (typeof value === 'object' && HasOwnProperty(value, 'toString') && typeof value.toString === 'function')
            return value.toString();
        return '';
    }
}
