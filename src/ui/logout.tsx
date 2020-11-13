import * as React from 'react';
import { PushButton } from './common/push-button';
import * as Api from '../mmb/api';
import { AuthQuery } from '../mmb/auth-query';
import { Response } from '../mmb/response';
import { ResponseDeserializers } from '../mmb/response-deserializers';
import { SessionQuery } from '../mmb/session-query';

interface State {
    username: string;
}

async function getSessionInfo() {
    const resp  = await SessionQuery.info();
    if (resp.status !== 200)
        throw new Error(`Failed to get session info, ${resp.status} ${resp.statusText}`);

    const json = await resp.json();
    const r = Response.parse<Api.SessionInfo>(json, ResponseDeserializers.toSessionInfo);

    if (Response.isOk(r))
        return r.data.username;
    throw new Error('Failed to get session info, invalid response');
}

export class Logout extends React.Component<Logout.Props, State> {
    constructor(props: Logout.Props) {
        super(props);

        this.state = { username: '' };

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

    componentDidMount() {
        getSessionInfo().then(username => {
            console.log('Requesting session info');
            this.setState({
                ...this.state,
                username,
            });
        }).catch(e => console.error(e.toString()));
    }

    render() {
        return (
            <div className='logout-container'>
                <div className='inlined'>User: {this.state.username}</div>
                <PushButton
                    className='pushbutton-logout'
                    value='Log out'
                    onClick={() => this.logOut()} />
            </div>
        );
    }
}

export namespace Logout {
    export interface Props {
    }
}