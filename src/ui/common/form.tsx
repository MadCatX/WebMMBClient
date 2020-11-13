import * as React from 'react';

export abstract class Form<KE, KV, T, PE extends FormUtil.Props<KV, T>> extends React.Component<PE, FormUtil.State<KE, KV, T>> {
    protected handleOnSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        console.log(this.state.values);
        if (this.props.onSubmitted !== undefined) {
            this.props.onSubmitted(this.state.values);
        }
    }

    protected isValid = () => {
        for (const k in this.state.errors) {
            if (k !== '')
                return false;
        }
        return true;
    }

    private FU = new FormUtilClass<KE, KV, T>();

    protected emptyErrors() {
        return this.FU.emptyErrors();
    }

    protected emptyValues() {
        return this.FU.emptyValues();
    }

    protected getArray<U extends FormUtil.V<T>>(data: FormUtil.State<KE, KV, T>, key: KV): U {
        return this.FU.getArray<U>(data, key);
    }

    protected getErrors(data: FormUtil.State<KE, KV, T>, key: KE) {
        return this.FU.getErrors(data, key);
    }

    protected getScalar<U extends FormUtil.V<T>>(data: FormUtil.State<KE, KV, T>, key: KV, def: U): U {
        return this.FU.getScalar<U>(data, key, def);
    }

    protected maybeGetScalar<U extends FormUtil.V<T>>(data: FormUtil.State<KE, KV, T>, key: KV, def?: U): U|undefined {
        return this.FU.maybeGetScalar<U>(data, key, def);
    }

    protected updateErrors(data: FormUtil.ContextData<KE, KV, T>, entry: { key: KE, errors: string[] }) {
        this.FU.updateErrors(data, entry);
    }

    protected updateMultipleErrors(data: FormUtil.ContextData<KE, KV, T>, entries: { key: KE, errors: string[] }[]) {
        this.FU.updateMultipleErrors(data, entries);
    }

    protected updateValue(data: FormUtil.ContextData<KE, KV, T>, entry: { key: KV, value: FormUtil.V<T> }) {
        this.FU.updateValue(data, entry);
    }

    protected updateValues(data: FormUtil.ContextData<KE, KV, T>, entries: { key: KV, value: FormUtil.V<T> }[]) {
        this.FU.updateValues(data, entries);
    }

    protected updateErrorsAndValues(data: FormUtil.ContextData<KE, KV, T>, errors: { key: KE, errors: string[] }[], values: { key: KV, value: FormUtil.V<T> }[]) {
        this.FU.updateErrorsAndValues(data, errors, values);
    }

    protected abstract renderContent(): React.ReactNode;

    setErrors = (errors: FormUtil.Errors<KE>) => {
        this.setState(
            {
                ...this.state,
                errors: new Map([...this.state.errors, ...errors]),
            },
        );
    }

    setErrorsAndValues = (errors: FormUtil.Errors<KE>, values: FormUtil.Values<KV, T>) => {
        this.setState(
            {
                ...this.state,
                errors: new Map([...this.state.errors, ...errors]),
                values: new Map([...this.state.values, ...values]),
            },
        );
    }

    setValues = (values: FormUtil.Values<KV, FormUtil.V<T>>) => {
        this.setState(
            {
                ...this.state,
                values: new Map([...this.state.values, ...values]),
            },
        );
    }

    constructor(props: PE) {
        super(props);

        this.state = {
            errors: new Map<KE, string[]>(),
            values: this.props.initialValues,
        };
    }

    render() {
        return (
            this.renderContent()
        );
    }
}

export namespace FormUtil {
    export type Errors<KE> = Map<KE, string[]>;

    export type V<T> = T | string | number | boolean;
    export type Values<KV, T> = Map<KV, V<T>>;

    export interface State<KE, KV, T> {
        errors: Errors<KE>;
        values: Values<KV, V<T>>;
    }

    export interface ContextData<KE, KV, T> extends State<KE, KV, T> {
        setErrors: (errors: Errors<KE>) => void;
        setValues: (values: Values<KV, V<T>>) => void;
        setErrorsAndValues: (errors: Errors<KE>, values: Values<KV, V<T>>) => void;
    }

    export interface Props<KV, T> {
        id: string;
        initialValues: Values<KV, V<T>>;
        onSubmitted?: (arg0: Values<KV, T>) => void;
    }
}

export class FormUtilClass<KE, KV, T> {
        emptyErrors() {
            return new Map<KE, string[]>();
        }

        emptyValues() {
            return new Map<KV, FormUtil.V<T>>();
        }

        getArray<U extends FormUtil.V<T>>(data: FormUtil.State<KE, KV, T>, key: KV): U {
            type ArrayType = U extends (infer AT)[] ? AT : never;
            return (data.values.get(key) ?? new Array<ArrayType>()) as U;
        }

        getErrors(data: FormUtil.State<KE, KV, T>, key: KE) {
            return data.errors.get(key) ?? [];
        }

        getScalar<U extends FormUtil.V<T>>(data: FormUtil.State<KE, KV, T>, key: KV, def: U): U {
            return (data.values.get(key) ?? def) as U;
        }

        maybeGetScalar<U extends FormUtil.V<T>>(data: FormUtil.State<KE, KV, T>, key: KV, def?: U): U|undefined {
            if (!data.values.has(key))
                return def;

            return data.values.get(key) as U;
        }

        updateErrors(data: FormUtil.ContextData<KE, KV, T>, entry: { key: KE, errors: string[] }) {
            this.updateMultipleErrors(data, [entry]);
        }

        updateMultipleErrors(data: FormUtil.ContextData<KE, KV, T>, entries: { key: KE, errors: string[] }[]) {
            const ne = this.emptyErrors();
            for (const e of entries)
                ne.set(e.key, e.errors);
            data.setErrors(ne);
        }

        updateValue(data: FormUtil.ContextData<KE, KV, T>, entry: { key: KV, value: FormUtil.V<T> }) {
            this.updateValues(data, [entry]);
        }

        updateValues(data: FormUtil.ContextData<KE, KV, T>, entries: { key: KV, value: FormUtil.V<T> }[]) {
            const nv = this.emptyValues();
            for (const e of entries)
                nv.set(e.key, e.value);
            data.setValues(nv);
        }

        updateErrorsAndValues(data: FormUtil.ContextData<KE, KV, T>, errors: { key: KE, errors: string[] }[], values: { key: KV, value: FormUtil.V<T> }[]) {
            const ne = this.emptyErrors();
            for (const e of errors)
                ne.set(e.key, e.errors);
            const nv = this.emptyValues();
            for (const e of values)
                nv.set(e.key, e.value);

            data.setErrorsAndValues(ne, nv);
        }
}
