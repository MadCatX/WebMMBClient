import * as React from 'react';

export class FormBlock<T extends FormBlock.Props> extends React.Component<T> {
}

export namespace FormBlock {
    export interface Props {
        formId: string;
    }
}
