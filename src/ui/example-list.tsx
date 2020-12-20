/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as Api from '../mmb/api';
import { AppQuery } from '../mmb/app-query';
import { JsonCommands, jsonCommandsFromJson } from '../mmb/commands';
import { JobQuery } from '../mmb/job-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';
import { Net } from '../util/net';
import { PushButton } from './common/push-button';

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
                <div className='table-column-header'></div>
                {this.state.examples.map(item => {
                    return (
                        <>
                            <div className='table-item'>{item.name}</div>
                            <div className='table-item'>{item.description}</div>
                            <PushButton
                                className='pushbutton-common pushbutton-chained pushbutton-clr-default pushbutton-hclr-default table-item'
                                value='Show >>'
                                onClick={() => this.activateExample(item.name)} />
                        </>
                    );
                })}
            </>
        );
    }

    private activateExample(name: string) {
        Net.abortFetch(this.activateExampleAborter);

        const { promise, aborter } = AppQuery.activateExample(name);
        this.activateExampleAborter = aborter;
        promise.then(resp => {
        resp.json().then(json => {
            if (Net.isFetchAborted(aborter))
                    return;

                const r = Response.parse(json, ResponseDeserializers.toJobInfo)
                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        error: r.message
                    });
                } else if (Response.isOk(r)) {
                    const info = r.data;

                    // Stage 2 - Get the commands
                    const { promise, aborter } = JobQuery.commands(info.id);
                    this.activateExampleAborter = aborter;
                    promise.then(resp => {
                        resp.json().then(json => {
                            if (Net.isFetchAborted(aborter))
                                return;

                            const rr = Response.parse(json, jsonCommandsFromJson);
                            if (Response.isError(rr)) {
                                this.setState({
                                    ...this.state,
                                    error: rr.message
                                });
                            } else if (Response.isOk(rr)) {
                                this.props.onExampleSelected(info, rr.data);
                            }
                        }).catch(e => {
                            this.setState({
                                ...this.state,
                                error: e.toString()
                            })
                        });
                    }).catch(e => {
                        this.setState({
                            ...this.state,
                            error: e.toString(),
                        })
                    });
                }
            }).catch(e => {
                this.setState({
                    ...this.state,
                    error: e.toString()
                });
            })
        }).catch(e => {
            this.setState({
                ...this.state,
                error: e.toString()
            });
        });
    }

    componentDidMount() {
        Net.abortFetch(this.listExamplesAborter);

        const { promise, aborter } = AppQuery.listExamples();
        this.listExamplesAborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(this.listExamplesAborter))
                    return;

                const r = Response.parse(json, ResponseDeserializers.toExampleList);

                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        error: r.message,
                        examples: [],
                    });
                } else if (Response.isOk(r)) {
                    this.setState({
                        ...this.state,
                        error: '',
                        examples: r.data
                    });
                }
            }).catch(e => {
                this.setState({
                    ...this.state,
                    error: e.toString(),
                    examples: []
                });
            })
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setState({
                ...this.state,
                error: e.toString(),
                examples: []
            });
        });
    }

    componentWillUnmount() {
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
        (info: Api.JobInfo, commands: JsonCommands): void;
    }

    export interface Props {
        onExampleSelected: OnExampleSelected;
    }
}
