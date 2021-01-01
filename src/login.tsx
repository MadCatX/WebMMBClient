/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AuthQuery } from './mmb/auth-query';
import { Form } from './ui/common/form';
import { LabeledField, GLabeledField } from './ui/common/labeled-field';
import { LoginFormUtil as LfUtil } from './ui/login-form-util';
import { ErrorBox } from './ui/common/error-box';
import { FormContextManager as FCM } from './ui/common/form-context-manager';
import { PushButton } from './ui/common/push-button';
import { Net } from './util/net';
import { versionInfo } from './version';

const StrLabeledField = LabeledField<LfUtil.ErrorKeys, LfUtil.ValueKeys, LfUtil.Values, string>();

export class Login extends Form<LfUtil.ErrorKeys, LfUtil.ValueKeys, LfUtil.ValueTypes, LfUtil.Props> {
    private aborter: AbortController | null = null;

    constructor(props: LfUtil.Props) {
        super(props);

        FCM.registerContext<LfUtil.ErrorKeys, LfUtil.ValueKeys, LfUtil.ValueTypes>(props.id);

        this.logIn = this.logIn.bind(this);
    }

    private logIn() {
        const session_id = this.getScalar<string>(this.state, 'login-session-id', '');

        Net.abortFetch(this.aborter);

        const { promise, aborter } = AuthQuery.logIn(session_id);
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
        FCM.unregisterContext(this.props.id);
    }

    renderContent() {
        const ctxData: LfUtil.ContextData = {
            ...this.state,
            clearErrors: this.clearErrors,
            clearValues: this.clearValues,
            clearErrorsAndValues: this.clearErrorsAndValues,
            setErrors: this.setErrors,
            setValues: this.setValues,
            setErrorsAndValues: this.setErrorsAndValues,
        };

        const verinfo = versionInfo();
        const Ctx = FCM.getContext(this.props.id);

        return (
            <>
                <Ctx.Provider value={ctxData}>
                    <div className='login-form-container'>
                        <div className='login-form-caption'>WebMMB alpha</div>
                        <div className='login-form-version-info'>
                            <div className='version-info-text'>{`Version: ${verinfo.date} (${verinfo.rev})`}</div>
                        </div>
                        <div className='login-form-input'>
                            <StrLabeledField
                                {...GLabeledField.tags('login-session-id', this.props.id, ['centered-horizontal', 'login-form-input'])}
                                formId={this.props.id}
                                label='Session ID'
                                style='left'
                                inputType='line-edit'
                                hint='Enter session ID to restore session'
                                options={[]} />
                        </div>
                        <ErrorBox
                            errors={this.getErrors(this.state, 'login-errors') ?? new Array<string>()} />
                        <PushButton
                            value='Enter'
                            className='pushbutton-common pushbutton-clr-default pushbutton-hclr-green'
                            onClick={() => this.logIn()} />
                    </div>
                </Ctx.Provider>
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
        id='login-form'
        initialValues={new Map<LfUtil.ValueKeys, LfUtil.Values>()} />,
    document.getElementById('app-login')
);