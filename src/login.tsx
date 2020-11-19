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
import { FormContextManager as FCM } from './ui/form-context-manager';
import { PushButton } from './ui/common/push-button';
import { ErrorBox } from './ui/common/error-box';

const StrLabeledField = LabeledField<LfUtil.ErrorKeys, LfUtil.ValueKeys, LfUtil.Values, string>();

export class Login extends Form<LfUtil.ErrorKeys, LfUtil.ValueKeys, LfUtil.ValueTypes, LfUtil.Props> {
    constructor(props: LfUtil.Props) {
        super(props);

        FCM.registerContext<LfUtil.ErrorKeys, LfUtil.ValueKeys, LfUtil.ValueTypes>(props.id);

        this.logIn = this.logIn.bind(this);
    }

    private logIn() {
        const session_id = this.getScalar<string>(this.state, 'login-session-id', '');

        AuthQuery.logIn(session_id).then(resp => {
            if (resp.ok === true && resp.redirected) {
                window.location.href = resp.url;
            } else {
                resp.text().then(text => {
                    this.setAuthError(text);
                }).catch(e => {
                    this.setAuthError(e.toString());
                });
            }
        }).catch(e => {
            this.setAuthError(e.toString());
        });
    }

    private setAuthError(error: string) {
        const ne = this.emptyErrors();
        ne.set('login-errors', [`Authentication failure: ${error}`]);
        this.setState({
            ...this.state,
            errors: ne,
        });
    }

    componentWillUnmount() {
        FCM.unregisterContext(this.props.id);
    }

    renderContent() {
        const ctxData: LfUtil.ContextData = {
            ...this.state,
            setErrors: this.setErrors,
            setValues: this.setValues,
            setErrorsAndValues: this.setErrorsAndValues,
        };

        const Ctx = FCM.getContext(this.props.id);

        return (
            <Ctx.Provider value={ctxData}>
                <div className='login-form-container'>
                    <div className='login-form-caption'>WebMMB alpha</div>
                    <StrLabeledField
                        {...GLabeledField.tags('login-session-id', this.props.id, ['centered-horizontal', 'login-form-input'])}
                        formId={this.props.id}
                        label='Session ID'
                        position='left'
                        inputType='line-edit'
                        hint='Enter session ID to restore session'
                        options={[]} />
                    <ErrorBox
                        errors={this.getErrors(this.state, 'login-errors') ?? new Array<string>()} />
                    <PushButton
                        value='Enter'
                        className='pushbutton-default pushbutton-hc-green'
                        onClick={() => this.logIn()} />
                </div>
            </Ctx.Provider>
        );
    }
}

ReactDOM.render(
    <Login
        id='login-form'
        initialValues={new Map<LfUtil.ValueKeys, LfUtil.Values>()} />,
    document.getElementById('app-login')
);