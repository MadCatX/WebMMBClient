/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { ErrorBox } from './common/error-box';

export class MmbCommands extends React.Component<MmbCommands.Props> {
    render() {
        return (
            <div className="section">
                <div className="section-caption">MMB commands</div>
                <pre className="verbatim">
                    {this.props.commands.map((line) => `${line}\n`)}
                </pre>
                <ErrorBox errors={this.props.errors} />
            </div>
        );
    }
}

export namespace MmbCommands {
    export interface Props {
        commands: string[];
        errors: string[];
    }
}
