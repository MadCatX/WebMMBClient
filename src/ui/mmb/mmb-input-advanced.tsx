/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { AdvancedMmbParameters } from './advanced-mmb-parameters';
import { BaseInteractionsInput } from './base-interactions-input';
import { CommonParametersInput } from './common-parameters-input';
import { CompoundsInput } from './compounds-input';
import { DoubleHelicesInput } from './double-helices-input';
import { MmbCommands } from './mmb-commands';
import { MobilizersInput } from './mobilizers-input';
import { NtCsInput } from './ntcs-input';
import { AdditionalFilesInput } from './additional-files-input';
import { MmbSetup } from '../../model/mmb/mmb-setup';

export class MmbInputAdvanced extends React.Component<MmbInputAdvanced.Props> {
    render() {
        return (
            <div>
                <CompoundsInput setup={this.props.setup} />
                <DoubleHelicesInput setup={this.props.setup} />
                <BaseInteractionsInput setup={this.props.setup} />
                <NtCsInput setup={this.props.setup} />
                <MobilizersInput setup={this.props.setup} />
                <AdditionalFilesInput
                    jobId={this.props.jobId}
                    setup={this.props.setup}
                />
                <CommonParametersInput
                    availableStages={this.props.availableStages}
                    setup={this.props.setup}
                />
                <AdvancedMmbParameters setup={this.props.setup} />
                <MmbCommands setup={this.props.setup} />
            </div>
        );
    }
}

export namespace MmbInputAdvanced {
    export interface Props {
        availableStages: number[];
        jobId: string;
        setup: MmbSetup,
    }
}