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
import { LoginModel as LM } from './model/login-model';
import { Form } from './ui/common/form/form';
import { LabeledField } from './ui/common/form/labeled-field';
import { ErrorBox } from './ui/common/error-box';
import { FormContextManager as FCM } from './model/common/form-context-manager';
import { PushButton } from './ui/common/push-button';
import { Net } from './util/net';
import { versionInfo } from './version';

const StrLField = LabeledField.LineEdit<LM.ErrorKeys, LM.ValueKeys, LM.ValueTypes>();

export class Login extends Form<LM.ErrorKeys, LM.ValueKeys, LM.ValueTypes, LM.Props> {
    private aborter: AbortController | null = null;
    private Ctx: React.Context<LM.ContextData>;

    constructor(props: LM.Props) {
        super(props);

        this.state = {
            ...this.initialBaseState(),
        };

        this.Ctx = FCM.makeContext();
    }

    private logIn = () => {
        const session_id = this.getScalar<string>(this.state, 'login-session-id', '');

        Net.abortFetch(this.aborter);

        const { promise, aborter } = AuthReqeust.logIn(session_id);
        this.aborter = aborter;
        promise.then(resp => {
            if (resp.status === 200) {
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

    private setAuthError(error: string, status?: number) {
        const ne = this.emptyErrors();
        ne.set('login-errors', [`Authentication failure: ${status} ${error}`]);
        this.setState({
            ...this.state,
            errors: ne,
        });
    }

    componentWillUnmount() {
        Net.abortFetch(this.aborter);
    }

    renderContent() {
        const ctxData: LM.ContextData = {
            ...this.state,
            clearErrors: this.clearErrors,
            clearValues: this.clearValues,
            clearErrorsAndValues: this.clearErrorsAndValues,
            setErrors: this.setErrors,
            setValues: this.setValues,
            setErrorsAndValues: this.setErrorsAndValues,
        };

        const verinfo = versionInfo();

        return (
            <>
                <this.Ctx.Provider value={ctxData}>
                    <div className='login-form-container'>
                        <div className='login-form-caption'>WebMMB alpha</div>
                        <div className='login-form-version-info'>
                            <div className='version-info-text'>{`Version: ${verinfo.date} (${verinfo.rev})`}</div>
                        </div>
                        <div className='login-form-input'>
                            <StrLField
                                id='login-session-id'
                                keyId='login-session-id'
                                label='Session ID'
                                style='left'
                                hint='Enter session ID to restore session'
                                className='line-edit fit-width-input'
                                ctxData={ctxData} />
                        </div>
                        <ErrorBox
                            errors={this.getErrors(this.state, 'login-errors') ?? new Array<string>()} />
                        <PushButton
                            value='Enter'
                            className='pushbutton-common pushbutton-clr-default pushbutton-hclr-green'
                            onClick={() => this.logIn()} />
                    </div>
                </this.Ctx.Provider>
                <div className='cookie-notice'>
                    <span className='bold'>Privacy notice:&nbsp;</span>
                    This site uses cookies to keep track of your session. By logging into WebMMB, you agree to have cookies stored in your browser cache.
                </div>
            </>
        );
    }
}

ReactDOM.render(
    <Login
        initialValues={new Map<LM.ValueKeys, LM.Values>()} />,
    document.getElementById('app-login')
);