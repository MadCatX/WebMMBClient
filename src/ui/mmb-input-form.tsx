/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { AdvancedMmbOptions } from './advanced-mmb-options';
import { BaseInteractionsInput } from './base-interactions-input';
import { CompoundsInput } from './compounds-input';
import { DensityFitInput } from './density-fit-input';
import { DoubleHelicesInput } from './double-helices-input';
import { GlobalParametersInput } from './global-parameters-input';
import { MobilizersInput } from './mobilizers-input';
import { NtCsInput } from './ntcs-input';
import { AdditionalFilesInput } from './additional-files-input';
import { Form } from './common/form/form';
import { TextArea } from './common/form/text-area';
import { ParameterNames, Parameters } from '../mmb/available-parameters';
import { CommandsSerializer, JsonCommandsSerializer, TextCommandsSerializer } from '../mmb/commands-serializer';
import { GlobalConfig } from '../model/global-config';
import { Reporting } from '../model/reporting';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { Mobilizer } from '../model/mobilizer';
import { NtCConformation } from '../model/ntc-conformation';
import { MdParameters } from '../model/md-parameters';
import { FormContextManager as FCM } from '../model/common/form-context-manager';
import { JobNameInput } from './job-name-input';
import { MmbCommands } from './mmb-commands';
import { Num } from '../util/num';
import {PushButton} from './common/push-button';
import {ErrorBox} from './common/error-box';
import {DensityFitFile} from '../model/density-fit-file';
import {DensityFitFiles} from '../model/density-fit-files';

const RawCmdsTA = TextArea.Spec<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes>();

export class MmbInputForm extends Form<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, MmbInputForm.Props> {
    private Ctx: React.Context<MIM.ContextData>;

    constructor(props: MmbInputForm.Props) {
        super(props);

        this.state = {
            ...this.initialBaseState(),
        };

        this.Ctx = FCM.makeContext();
    }

    getValues() {
        return new Map([ ...this.state.values ]);
    }

    commandsToJob() {
        return JsonCommandsSerializer.serialize(this.makeParams());
    }

    rawCommandsToJob() {
        return this.getScalar<string>(this.state, 'mol-in-raw-commands', '');
    }

    private importGuidedToRaw() {
        try {
            const commands = TextCommandsSerializer.serialize(this.makeParams()).reduce((txt, line) => txt + line + '\n');
            const v = this.emptyValues();
            v.set('mol-in-raw-commands', commands);
            this.setErrorsAndValues(
                new Map(),
                new Map([...this.state.values, ...v])
            );
        } catch (e) {
            this.setErrors(new Map([['mol-raw', e]]));
        }
    }

    private makeControls(mode: MIM.UiMode, ctxData: MIM.ContextData) {
        switch (mode) {
        case 'simple':
            return (
                <>
                    <CompoundsInput ctxData={ctxData} />
                    <DoubleHelicesInput ctxData={ctxData} />
                    <BaseInteractionsInput ctxData={ctxData} />
                    <NtCsInput ctxData={ctxData} />
                    <MobilizersInput ctxData={ctxData} />
                    <GlobalParametersInput
                        ctxData={ctxData}
                        availableStages={this.props.availableStages}
                    />
                </>
            );
        case 'advanced':
            return (
                <>
                    <CompoundsInput ctxData={ctxData} />
                    <DoubleHelicesInput ctxData={ctxData} />
                    <BaseInteractionsInput ctxData={ctxData} />
                    <NtCsInput ctxData={ctxData} />
                    <AdditionalFilesInput ctxData={ctxData} jobId={this.props.jobId} />
                    <GlobalParametersInput
                        ctxData={ctxData}
                        availableStages={this.props.availableStages}
                    />
                    <AdvancedMmbOptions ctxData={ctxData} />
                    {this.makeMmbCommands()}
                </>
            );
        case 'maverick':
            return (
                <>
                     <div className='pushbutton-flex-container'>
                         <PushButton
                             className='pushbutton-common pushbutton-flex pushbutton-hclr-default'
                             value='Import from guided mode'
                             onClick={() => this.importGuidedToRaw()} />
                     </div>
                     <div className='raw-commands-container'>
                         <RawCmdsTA
                             id='mmb-in-raw-commands'
                             keyId='mol-in-raw-commands'
                             spellcheck={false}
                             resizeMode={'vertical'}
                             rows={30}
                             ctxData={ctxData} />
                         <ErrorBox
                             errors={this.state.errors.get('mol-raw') ?? []} />
                     </div>
                </>
            );
        case 'density-fit':
            return (
                <>
                    <DensityFitInput
                        ctxData={ctxData}
                        jobId={this.props.jobId}
                    />
                    <GlobalParametersInput
                        ctxData={ctxData}
                        availableStages={this.props.availableStages}
                    />
                </>
            );
        }
    }

    private makeMmbCommands() {
        try {
            const cmds = TextCommandsSerializer.serialize(this.makeParams());

            return (
                <MmbCommands
                    commands={cmds}
                    errors={new Array<string>()} />
            );
        } catch (e) {
            return (
                <MmbCommands
                    commands={new Array<string>()}
                    errors={e} />
            );
        }
    }

    componentDidUpdate(prevProps: MmbInputForm.Props) {
        if (prevProps.initialValues !== this.props.initialValues) {
            // FIXME: This is beyond nasty!!!
            this.setState({
                ...this.state,
                ...this.initialBaseState(),
            });
            return;
        }

        // Ridiculous flip-flop to make sure we have the initial stage set right
        const currentStage = this.getScalar(this.state, 'mol-in-gp-stage', 1);
        if (prevProps.mode !== this.props.mode && this.props.mode === 'density-fit') {
            if (currentStage < 2) {
                const v = this.emptyValues();
                v.set('mol-in-gp-stage', 2);
                this.setValues(new Map([...this.state.values, ...v]));
            }
        } else if (!this.props.availableStages.includes(currentStage)) {
            const v = this.emptyValues();
                v.set('mol-in-gp-stage', this.props.availableStages[this.props.availableStages.length - 1]);
            this.setValues(new Map([...this.state.values, ...v]));
        }
    }

    private makeCommonParams(): CommandsSerializer.CommonParameters {
        let errors: string[] = [];

        const repInt = Num.parseFloatStrict(this.getScalar(this.state, 'mol-in-gp-reporting-interval', ''));
        const numReps = Num.parseIntStrict(this.getScalar(this.state, 'mol-in-gp-num-reports', ''));
        const stage = this.getScalar(this.state, 'mol-in-gp-stage', NaN);

        if (isNaN(repInt))
            errors.push('Report interval must be a number');
        if (isNaN(numReps))
            errors.push('Number of reports must be a number');
        if (isNaN(stage))
            errors.push('Stage is not a valid number');

        if (errors.length > 0)
            throw errors;

        return {
            reporting: new Reporting(repInt, numReps),
            stages: { first: stage, last: stage },
        };
    }

    private makeDensityFitParams(): CommandsSerializer.DensityFitParameters {
        let errors: string[] = [];

        const denFitFiles = this.getArray<DensityFitFile[]>(this.state, 'mol-in-density-fit-files-added');
        const structFile = denFitFiles.find(f => f.type === 'structure');
        const denMapFile = denFitFiles.find(f => f.type === 'density-map');

        if (!structFile)
            errors.push('No structure file');
        else if (!structFile.isUploaded)
            errors.push('Structure file has not been uploaded to server');
        if (!denMapFile)
            errors.push('No density map file');
        else if (!denMapFile.isUploaded)
            errors.push('Density map file has not been uploaded to server');

        try {
            const common = this.makeCommonParams();

            if (errors.length === 0) {
                return {
                    jobType: 'density-fit',
                    ...common,
                    densityFitFiles: new DensityFitFiles(structFile!.name, denMapFile!.name),
                };
            }
        } catch (e) {
            errors = errors.concat(e);
        }

        throw errors;
    }

    private makeStandardParams(): CommandsSerializer.StandardParameters<ParameterNames> {
        let errors: string[] = [];

        const bisf = Num.parseIntStrict(this.getScalar(this.state, 'mol-in-gp-bisf', ''));
        const temp = Num.parseFloatStrict(this.getScalar(this.state, 'mol-in-gp-temperature', ''));
        const useDefMd = this.getScalar(this.state, 'mol-in-gp-def-md-params', false);

        if (isNaN(bisf))
            errors.push('Base interaction scale factor must be a number');
        if (isNaN(temp))
            errors.push('Temperature must be a number');

        errors = errors.concat(this.getErrors(this.state, 'mol-adv-params'));

        try {
            const common = this.makeCommonParams();

            if (errors.length === 0) {
                const global = new GlobalConfig(bisf, temp);
                const mdParameters = new MdParameters(useDefMd);

                const compounds = this.getArray<Compound[]>(this.state, 'mol-in-cp-added');
                const doubleHelices = this.getArray<DoubleHelix[]>(this.state, 'mol-in-dh-added');
                const baseInteractions = this.getArray<BaseInteraction[]>(this.state, 'mol-in-bi-added');
                const ntcs = this.getArray<NtCConformation[]>(this.state, 'mol-in-ntcs-added');
                const mobilizers = this.getArray<Mobilizer[]>(this.state, 'mol-in-mobilizers-added');
                const advValues = this.getScalar(this.state, 'mol-adv-params', new Map<ParameterNames, unknown>());

                return {
                    jobType: 'standard',
                    ...common,
                    global,
                    compounds,
                    doubleHelices,
                    baseInteractions,
                    ntcs,
                    mobilizers,
                    mdParameters,
                    advParams: { parameters: Parameters, values: advValues },
                };
            }
        } catch (e) {
            errors = errors.concat(e);
        }

        throw errors;
    }

    private makeParams(): CommandsSerializer.DensityFitParameters|CommandsSerializer.StandardParameters<ParameterNames> {
        switch (this.props.mode) {
        case 'simple':
        case 'advanced':
        case 'maverick':
            return this.makeStandardParams();
        case 'density-fit':
            return this.makeDensityFitParams();
        }
    }

    protected renderContent() {
        const ctxData: MIM.ContextData = {
            ...this.state,
            clearErrors: this.clearErrors,
            clearValues: this.clearValues,
            clearErrorsAndValues: this.clearErrorsAndValues,
            setErrors: this.setErrors,
            setValues: this.setValues,
            setErrorsAndValues: this.setErrorsAndValues,
        };

        return (
            <this.Ctx.Provider value={ctxData}>
                <form>
                    <JobNameInput ctxData={ctxData} name={this.props.jobName} />
                    {this.makeControls(this.props.mode, ctxData)}
                </form>
            </this.Ctx.Provider>
        );
    }
}

export namespace MmbInputForm {
    export interface Props extends MIM.Props {
        availableStages: number[];
        mode: MIM.UiMode;
    }
}