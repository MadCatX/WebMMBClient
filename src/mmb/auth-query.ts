import { AuthRequest } from './api';
import { Request } from './request';

export namespace AuthQuery {
    export function logIn(username: string) {
        const req: AuthRequest = { auth_type: 'LogIn', username };
        return Request.auth(req);
    }

    export function logOut() {
        const req: AuthRequest = { auth_type: 'LogOut', username: '' };
        return Request.auth(req);
    }
}