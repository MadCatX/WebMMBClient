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

export class Logout extends React.Component<Logout.Props> {
    constructor(props: Logout.Props) {
        super(props);

        this.logOut = this.logOut.bind(this);
    }

    private logOut() {
        AuthQuery.logOut().then(resp => {
            if (resp.ok && resp.redirected)
                window.location.href = resp.url;
        }).catch(e => {
            alert(`Logout failure: ${e.message}`);
        });
    }

    render() {
        return (
            <div className='logout-container'>
                <div className='inlined'>ID: {this.props.username ?? ''}</div>
                <PushButton
                    className='pushbutton-chained pushbutton-hc-red'
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