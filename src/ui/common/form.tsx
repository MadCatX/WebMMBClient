import * as React from 'react';
import { FormModel, FormUtil } from '../../model/common/form';

export abstract class Form<KE, KV, T, PE extends FormModel.Props<KV, T>, SE extends FormModel.State<KE, KV, T> = FormModel.State<KE, KV, T>> extends React.Component<PE, SE> {
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

    private FU = new FormUtil<KE, KV, T>();

    protected emptyErrors() {
        return this.FU.emptyErrors();
    }

    protected emptyValues() {
        return this.FU.emptyValues();
    }

    protected getArray<U extends FormModel.V<T>>(data: FormModel.State<KE, KV, T>, key: KV): U {
        return this.FU.getArray<U>(data, key);
    }

    protected getErrors(data: FormModel.State<KE, KV, T>, key: KE) {
        return this.FU.getErrors(data, key);
    }

    protected getScalar<U extends FormModel.V<T>>(data: FormModel.State<KE, KV, T>, key: KV, def: U): U {
        return this.FU.getScalar<U>(data, key, def);
    }

    protected maybeGetScalar<U extends FormModel.V<T>>(data: FormModel.State<KE, KV, T>, key: KV, def?: U): U|undefined {
        return this.FU.maybeGetScalar<U>(data, key, def);
    }

    protected updateErrors(data: FormModel.ContextData<KE, KV, T>, entry: { key: KE, errors: string[] }) {
        this.FU.updateErrors(data, entry);
    }

    protected updateMultipleErrors(data: FormModel.ContextData<KE, KV, T>, entries: { key: KE, errors: string[] }[]) {
        this.FU.updateMultipleErrors(data, entries);
    }

    protected updateValue(data: FormModel.ContextData<KE, KV, T>, entry: { key: KV, value: FormModel.V<T> }) {
        this.FU.updateValue(data, entry);
    }

    protected updateValues(data: FormModel.ContextData<KE, KV, T>, entries: { key: KV, value: FormModel.V<T> }[]) {
        this.FU.updateValues(data, entries);
    }

    protected updateErrorsAndValues(data: FormModel.ContextData<KE, KV, T>, errors: { key: KE, errors: string[] }[], values: { key: KV, value: FormModel.V<T> }[]) {
        this.FU.updateErrorsAndValues(data, errors, values);
    }

    protected abstract renderContent(): React.ReactNode;

    clearErrors = (keys: KE[]) => {
        if (!keys.some(k => this.state.errors.has(k)))
            return;

        const errors = this.state.errors;

        keys.map(k => errors.delete(k));
        this.setState(
            {
                ...this.state,
                errors,
            }
        );
    }

    clearErrorsAndValues = (ke: KE[], kv: KV[]) => {
        const errors = this.state.errors;
        const values = this.state.values;
        let changed = false;

        if (ke.some(k => this.state.errors.has(k))) {
            ke.map(k => errors.delete(k));
            changed = true;
        }

        if (kv.some(k => this.state.values.has(k))) {
            kv.map(k => values.delete(k));
            changed = true;
        }

        if (changed) {
            this.setState(
                {
                    ...this.state,
                    errors,
                    values,
                }
            );
        }
    }

    clearValues = (keys: KV[]) => {
        if (!keys.some(k => this.state.values.has(k)))
            return;

        const values = this.state.values;

        keys.map(k => values.delete(k));
        this.setState(
            {
                ...this.state,
                values,
            }
        );
    }

    setErrors = (errors: FormModel.Errors<KE>) => {
        this.setState(
            {
                ...this.state,
                errors: new Map([...this.state.errors, ...errors]),
            },
        );
    }

    setErrorsAndValues = (errors: FormModel.Errors<KE>, values: FormModel.Values<KV, T>) => {
        this.setState(
            {
                ...this.state,
                errors: new Map([...this.state.errors, ...errors]),
                values: new Map([...this.state.values, ...values]),
            },
        );
    }

    setValues = (values: FormModel.Values<KV, FormModel.V<T>>) => {
        this.setState(
            {
                ...this.state,
                values: new Map([...this.state.values, ...values]),
            },
        );
    }

    constructor(props: PE) {
        super(props);
    }

    protected initialBaseState(): FormModel.State<KE, KV, T> {
        return {
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
