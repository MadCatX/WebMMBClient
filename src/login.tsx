/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AuthReqeust } from './mmb/auth-request';
import { LabeledField } from './ui/common/controlled/labeled-field';
import { ErrorBox } from './ui/common/error-box';
import { PushButton } from './ui/common/push-button';
import { Net } from './util/net';
import { versionInfo } from './version';

const StrLField = LabeledField.LineEdit<string>();

interface Props {}

interface State {
    sessionId: string;
    error: string;
}

export class Login extends React.Component<Props, State> {
    private aborter: AbortController | null = null;

    constructor(props: Props) {
        super(props);

        this.state = {
            sessionId: '',
            error: '',
        };
    }

    private logIn = () => {
        Net.abortFetch(this.aborter);

        const { promise, aborter } = AuthReqeust.logIn(this.state.sessionId);
        this.aborter = aborter;
        promise.then(resp => {
            if (resp.ok) {
                window.location.href = resp.url;
            } else {
                resp.text().then(text => {
                    this.setAuthError(text, resp.status);
                }).catch(e => {
                    this.setAuthError(e.toString());
                });
            }
        }).catch(e => {
            if (Net.isAbortError(e))
                return;
            this.setAuthError(e.toString());
        });
    }

    private setAuthError(msg: string, status?: number) {
        const error = `Authentication failure: ${status} ${msg}`;
        this.setState({ ...this.state, error });
    }

    componentWillUnmount() {
        Net.abortFetch(this.aborter);
    }

    render() {
        const verinfo = versionInfo();

        return (
            <div>
                <div className='login-form-container'>
                    <div className='login-form-caption'>WebMMB alpha</div>
                    <div className='login-form-version-info'>
                        <div className='version-info-text'>{`Version: ${verinfo.date} (${verinfo.rev})`}</div>
                    </div>
                    <div className='login-form-input'>
                        <StrLField
                            id='login-session-id'
                            label='Session ID'
                            style='left'
                            hint='Enter session ID to restore session'
                            className='line-edit fit-width-input'
                            value={this.state.sessionId}
                            updateNotifier={v => this.setState({ ...this.state, sessionId: v })}
                        />
                    </div>
                    {this.state.error !== ''
                        ?
                        <ErrorBox errors={[this.state.error]} />
                        :
                        undefined
                    }
                    <PushButton
                        value='Enter'
                        className='pushbutton-common pushbutton-clr-default pushbutton-hclr-green'
                        onClick={() => this.logIn()}
                    />
                </div>
                <div className='cookie-notice'>
                    <span className='bold'>Privacy notice:&nbsp;</span>
                    This site uses cookies to keep track of your session. By logging into WebMMB, you agree to have cookies stored in your browser cache.
                </div>
            </div>
        );
    }
}

ReactDOM.render(
    <Login />,
    document.getElementById('app-login')
);