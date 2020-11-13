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
        const username = this.getScalar<string>(this.state, 'login-username', '');

        const ne = this.emptyErrors();
        if (username.length < 1) {
            ne.set('login-errors', ['Please enter username']);
            this.setState({
                ...this.state,
                errors: ne,
            });
            return;
        }

        AuthQuery.logIn(username).then(resp => {
            if (resp.ok === true && resp.redirected) {
                window.location.href = resp.url;
            } else {
                ne.set('login-errors', [`Authentication failure: ${resp.statusText}`]);
                this.setState({
                    ...this.state,
                    errors: ne,
                });
            }
        }).catch(e => {
            ne.set('login-errors', [`Authentication failure: ${e.toString()}`]);
            this.setState({
                ...this.state,
                errors: ne,
            });
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
                        {...GLabeledField.tags('login-username', this.props.id, ['centered-horizontal', 'login-form-input'])}
                        formId={this.props.id}
                        label='Username'
                        position='left'
                        inputType='line-edit'
                        hint='Username'
                        options={[]} />
                    <ErrorBox
                        errors={this.getErrors(this.state, 'login-errors') ?? new Array<string>()} />
                    <PushButton
                        value='Log in'
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
    document.getElementById('app')
);