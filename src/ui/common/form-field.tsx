import * as React from 'react';
import { FormUtilClass } from './form';

export abstract class FormField<KE, KV, T, P extends FormField.Props<KV>, S = any> extends React.Component<P, S> {
    protected FU = new FormUtilClass<KE, KV, T>();
}

export namespace FormField {
    export interface Props<KV> {
        keyId: KV;
        formId: string;
        id?: string;
    }
}
