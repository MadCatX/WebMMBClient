/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { CommonParametersInput } from './common-parameters-input';
import { DensityFitInput } from './density-fit-input';
import { MobilizersInput } from './mobilizers-input';
import { NtCsInput } from './ntcs-input';
import { MmbSetup } from '../../model/mmb/mmb-setup';

export class MmbInputDensityFit extends React.Component<MmbInputDensityFit.Props> {
    render() {
        return (
            <div>
                <DensityFitInput
                    jobId={this.props.jobId}
                    setup={this.props.setup}
                />
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

export namespace MmbInputDensityFit {
    export interface Props {
        availableStages: number[];
        jobId: string;
        setup: MmbSetup,
    }
}