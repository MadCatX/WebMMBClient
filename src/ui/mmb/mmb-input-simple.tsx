/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { BaseInteractionsInput } from './base-interactions-input';
import { CommonParametersInput } from './common-parameters-input';
import { CompoundsInput } from './compounds-input';
import { DoubleHelicesInput } from './double-helices-input';
import { MobilizersInput } from './mobilizers-input';
import { NtCsInput } from './ntcs-input';
import { MmbSetup } from '../../model/mmb/mmb-setup';

export class MmbInputSimple extends React.Component<MmbInputSimple.Props> {
    render() {
        return (
            <div>
                <CompoundsInput setup={this.props.setup} />
                <DoubleHelicesInput setup={this.props.setup} />
                <BaseInteractionsInput setup={this.props.setup} />
                <NtCsInput setup={this.props.setup} />
                <MobilizersInput setup={this.props.setup} />
                <CommonParametersInput
                    availableStages={this.props.availableStages}
                    setup={this.props.setup}
                />
            </div>
        );
    }
}

export namespace MmbInputSimple {
    export interface Props {
        availableStages: number[];
        setup: MmbSetup,
    }
}