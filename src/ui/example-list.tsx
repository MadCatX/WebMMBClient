/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { PushButton } from './common/push-button';
import * as Api from '../mmb/api';
import { AppQuery } from '../mmb/app-query';
import { Net } from '../util/net';

interface State {
    error: string;
    examples: Api.ExampleListItem[];
}

export class ExampleList extends React.Component<ExampleList.Props, State> {
    private activateExampleAborter: AbortController | null = null;
    private listExamplesAborter: AbortController | null = null;

    constructor(props: ExampleList.Props) {
        super(props);

        this.state = {
            error: '',
            examples:  [],
        };
    }

    private renderItems() {
        return (
            <>
                <div className='table-column-header'>Name</div>
                <div className='table-column-header'>Description</div>
                <div className='table-column-header'>&nbsp;</div>
                {this.state.examples.map((item, index) => {
                    return (
                        <React.Fragment key={`${item.name}-${index}`}>
                            <div className='table-item'>{item.name}</div>
                            <div className='table-item'>{item.description}</div>
                            <PushButton
                                className='pushbutton-common pushbutton-chained pushbutton-clr-default pushbutton-hclr-default table-item'
                                value='Show >>'
                                onClick={() => this.activateExample(item.name)} />
                        </React.Fragment>
                    );
                })}
            </>
        );
    }

    private async activateExample(name: string) {
        Net.abortFetch(this.activateExampleAborter);

        const { aborter, performer } = AppQuery.activateExample(name);
        this.activateExampleAborter = aborter;

        try {
            const jobInfo = await performer();
            if (!jobInfo)
                return;

            this.props.onExampleSelected(jobInfo.id);
        } catch (e) {
            this.setState({
                ...this.state,
                error: (e as Error).toString(),
            });
        }
    }

    componentDidMount() {
        Net.abortFetch(this.listExamplesAborter);

        const { aborter, performer } = AppQuery.listExamples();
        this.listExamplesAborter = aborter;

        performer().then(examples => {
            if (!examples)
                return;

            this.setState({
                ...this.state,
                error: '',
                examples,
            });
        }).catch(e => {
            this.setState({
                ...this.state,
                error: e.toString(),
                examples: [],
            });
        });
    }

    componentWillUnmount() {
        Net.abortFetch(this.activateExampleAborter);
        Net.abortFetch(this.listExamplesAborter);
    }

    render() {
        return (
            <div className='example-list-container'>
                <div className='section-caption'>Examples</div>
                <div className='example-items-container'>
                    {this.renderItems()}
                </div>
                <div className='error-message'>{this.state.error}</div>
            </div>
        );
    }
}

export namespace ExampleList {
    export interface OnExampleSelected {
        (jobId: string): void;
    }

    export interface Props {
        onExampleSelected: OnExampleSelected;
    }
}
