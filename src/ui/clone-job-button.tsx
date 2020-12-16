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
import { JobQuery } from '../mmb/job-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';
import { Net } from '../util/net';

interface State {
    expanded: boolean;
    name: string;
    error: string;
}

export class CloneJobButton extends React.Component<CloneJobButton.Props, State> {
    private aborter: AbortController | null = null;

    constructor(props: CloneJobButton.Props) {
        super(props);

        this.state = {
            expanded: false,
            name: props.sourceName,
            error: '',
        };

        this.clone = this.clone.bind(this);
    }

    private clone() {
        Net.abortFetch(this.aborter);

        const { promise, aborter } = JobQuery.clone(this.props.id, this.state.name);
        this.aborter = aborter;
        promise.then(resp => {
            resp.json().then(json => {
                if (Net.isFetchAborted(aborter))
                    return;

                const r = Response.parse<Api.JobInfo>(json, ResponseDeserializers.toJobInfo);

                if (Response.isError(r)) {
                    this.setState({
                        ...this.state,
                        error: r.message,
                    });
                } else if (Response.isOk(r)) {
                    this.setState({
                        ...this.state,
                        expanded: false,
                        error: '',
                    });
                    this.props.notifyCloned(r.data.id);
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

    private renderInner() {
        if (this.state.expanded === false)
            return (undefined);
        return (
            <>
                <span>Name:</span>
                <input
                    className='fit-width-lineedit'
                    type='text'
                    value={this.state.name}
                    onChange={e => { this.setState({...this.state, name: e.currentTarget.value}) } } />
                {(this.state.error !== '') ? (<div className='error-message'>{this.state.error}</div>) : undefined}
                <PushButton
                    value='OK'
                    onClick={this.clone} />
            </>
        );
    }

    render() {
        return (
            <span>
                <PushButton
                    value={this.state.expanded ? 'Clone <<' : 'Clone >>'}
                    onClick={() => this.setState({...this.state, expanded: !this.state.expanded })} />
                {this.renderInner()}
            </span>
        );
    }
}

export namespace CloneJobButton {
    export interface NotifyCloned {
        (id: string): void;
    }

    export interface Props {
        id: string;
        sourceName: string;
        notifyCloned: NotifyCloned;
    }
}

