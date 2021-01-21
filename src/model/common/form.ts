/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export namespace FormModel {
    export type Errors<KE> = Map<KE, string[]>;

    export type V<T> = T | string | number | boolean;
    export type Values<KV, T> = Map<KV, V<T>>;

    export interface State<KE, KV, T> {
        errors: Errors<KE>;
        values: Values<KV, V<T>>;
    }

    export interface ContextData<KE, KV, T> extends State<KE, KV, T> {
        clearErrors: (keys: KE[]) => void;
        clearValues: (keys: KV[]) => void;
        clearErrorsAndValues: (ke: KE[], kv: KV[]) => void;
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

export class FormUtil<KE, KV, T> {
        emptyErrors() {
            return new Map<KE, string[]>();
        }

        emptyValues() {
            return new Map<KV, FormModel.V<T>>();
        }

        getArray<U extends FormModel.V<T>>(data: FormModel.State<KE, KV, T>, key: KV): U {
            type ArrayType = U extends (infer AT)[] ? AT : never;
            return (data.values.get(key) ?? new Array<ArrayType>()) as U;
        }

        getErrors(data: FormModel.State<KE, KV, T>, key: KE) {
            return data.errors.get(key) ?? [];
        }

        getScalar<U extends FormModel.V<T>>(data: FormModel.State<KE, KV, T>, key: KV, def: U): U {
            return (data.values.get(key) ?? def) as U;
        }

        maybeGetScalar<U extends FormModel.V<T>>(data: FormModel.State<KE, KV, T>, key: KV, def?: U): U|undefined {
            if (!data.values.has(key))
                return def;

            return data.values.get(key) as U;
        }

        updateErrors(data: FormModel.ContextData<KE, KV, T>, entry: { key: KE, errors: string[] }) {
            this.updateMultipleErrors(data, [entry]);
        }

        updateMultipleErrors(data: FormModel.ContextData<KE, KV, T>, entries: { key: KE, errors: string[] }[]) {
            const ne = this.emptyErrors();
            for (const e of entries)
                ne.set(e.key, e.errors);
            data.setErrors(ne);
        }

        updateValue(data: FormModel.ContextData<KE, KV, T>, entry: { key: KV, value: FormModel.V<T> }) {
            this.updateValues(data, [entry]);
        }

        updateValues(data: FormModel.ContextData<KE, KV, T>, entries: { key: KV, value: FormModel.V<T> }[]) {
            const nv = this.emptyValues();
            for (const e of entries)
                nv.set(e.key, e.value);
            data.setValues(nv);
        }

        updateErrorsAndValues(data: FormModel.ContextData<KE, KV, T>, errors: { key: KE, errors: string[] }[], values: { key: KV, value: FormModel.V<T> }[]) {
            const ne = this.emptyErrors();
            for (const e of errors)
                ne.set(e.key, e.errors);
            const nv = this.emptyValues();
            for (const e of values)
                nv.set(e.key, e.value);

            data.setErrorsAndValues(ne, nv);
        }
}
