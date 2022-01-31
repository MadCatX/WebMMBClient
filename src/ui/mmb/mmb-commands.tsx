/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { MmbSetupComponent } from './mmb-setup-component';
import { ErrorBox } from '../common/error-box';
import { TextCommandsSerializer } from '../../mmb/commands-serializer';
import { Conversion } from '../../model/conversion';
import { EmptyObject } from '../../util/types';

export class MmbCommands extends MmbSetupComponent<MmbCommands.Props, EmptyObject> {
    componentDidMount() {
        this.subscribe(this.props.setup.anything, () => this.forceUpdate());
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    private renderTextCommands() {
        const result = Conversion.setupToParameters(this.props.setup, 'standard-advanced');
        if (Conversion.isErrorResult(result))
            return <ErrorBox errors={result.errors} />;

        const text = TextCommandsSerializer.serialize(result.data).reduce((text, line) => text += `${line}\n`);
        return <pre className='verbatim'>{text}</pre>;
    }

    render() {
        return (
            <div className="section">
                <div className="section-caption">MMB commands</div>
                {this.renderTextCommands()}
            </div>
        );
    }
}

export namespace MmbCommands {
    export interface Props extends MmbSetupComponent.Props {
    }
}
