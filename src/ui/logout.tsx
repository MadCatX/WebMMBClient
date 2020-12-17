/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { PushButton } from './common/push-button';
import { AuthQuery } from '../mmb/auth-query';
import {TooltippedField} from './common/tooltipped-field';

interface State {
    copiedNote: boolean;
}

export class Logout extends React.Component<Logout.Props, State> {
    constructor(props: Logout.Props) {
        super(props);

        this.state = { copiedNote: false };

        this.logOut = this.logOut.bind(this);
        this.copyIdToClipboard = this.copyIdToClipboard.bind(this);
    }

    private copyIdToClipboard() {
        if (!navigator.clipboard) {
            console.warn('Clipboard API is not supported');
            return;
        }

        navigator.clipboard.writeText(this.props.username ?? '');

        this.setState({...this.state, copiedNote: true});
        setTimeout(() => this.setState({...this.state, copiedNote: false}), 1000);
    }

    private logOut() {
        AuthQuery.logOut().promise.then(resp => {
            if (resp.status === 200)
                window.location.href = resp.url;
        }).catch(e => {
            alert(`Logout failure: ${e.message}`);
        });
    }

    render() {
        const cpyCls = `green inlined ${this.state.copiedNote ? 'fading-text-visible' : 'fading-text-invisible'}`;
        return (
            <div className='logout-container'>
                <div className={cpyCls}>Copied!&nbsp;</div>
                <TooltippedField
                    position='below'
                    text='Click on the ID to copy it to clipboard'
                    renderContent={
                        () => (<div className='inlined' onClick={this.copyIdToClipboard}>Session ID: {this.props.username ?? ''}</div>)
                    } />
                <PushButton
                    className='pushbutton-common pushbutton-chained pushbutton-clr-default pushbutton-hclr-red'
                    value='Log out'
                    onClick={() => this.logOut()} />
            </div>
        );
    }
}

export namespace Logout {
    export interface Props {
        username?: string;
    }
}