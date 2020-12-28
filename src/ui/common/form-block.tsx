import * as React from 'react';

export class FormBlock<T extends FormBlock.Props, S = {}> extends React.Component<T, S> {
}

export namespace FormBlock {
    export interface Props {
        formId: string;
    }
}
