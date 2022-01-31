/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { Observable, Subscription } from 'rxjs';
import { MmbSetup } from '../../model/mmb/mmb-setup';

interface Handler<T> {
    (v: T): void;
}

export class MmbSetupComponent<P extends MmbSetupComponent.Props, S> extends React.Component<P, S> {
    private subscriptions: Subscription[] = [];

    protected subscribe<T>(obs: Observable<T>, h: Handler<T>) {
        this.subscriptions.push(obs.subscribe(h));
    }

    protected unsubscribeAll() {
        for (const s of this.subscriptions)
            s.unsubscribe();
    }
}

export namespace MmbSetupComponent {
    export interface Props {
        setup: MmbSetup;
    }
}
