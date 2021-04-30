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
import { DoubleHelicesInput } from './double-helices-input';
import { GlobalParametersInput } from './global-parameters-input';
import { MobilizersInput } from './mobilizers-input';
import { NtCsInput } from './ntcs-input';
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
        const name = this.getName();
        const commands = JsonCommandsSerializer.serialize(this.makeParams());

        return { name, commands };
    }

    rawCommandsToJob() {
        const name = this.getName();
        const commands = this.getScalar<string>(this.state, 'mol-in-raw-commands', '');

        return { name, commands };
    }

    private getName() {
        const name = this.getScalar(this.state, 'mol-in-job-name', '');

        const ne = this.emptyErrors();
        if (name === undefined || name === '') {
            ne.set('mol-in-no-name', ['Job must have a name']);

            this.setState({
                ...this.state,
                errors: new Map([...this.state.errors, ...ne]),
            });
            throw new Error('No name');
        } else {
            ne.set('mol-in-no-name', []);
            this.setState({
                ...this.state,
                errors: new Map([...this.state.errors, ...ne]),
            });
            return name; // FIXME: setting state and returning is nasty
        }
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

    private isAdv() {
        return this.props.mode === 'advanced';
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
                    errors={[e.toString()]} />
            );
        }
    }

    componentDidUpdate(prevProps: MmbInputForm.Props) {
        const v = this.emptyValues();
        if (this.props.availableStages.length !== prevProps.availableStages.length) {
            v.set('mol-in-gp-stage', this.props.availableStages.length);
        }
        if (this.props.currentStage !== null && this.props.currentStage !== prevProps.currentStage)
            v.set('mol-in-gp-stage', this.props.currentStage);

        if (v.size > 0)
            this.setValues(new Map([...this.state.values, ...v]));
    }

    private makeParams(): CommandsSerializer.Parameters<ParameterNames> {
        let errors: string[] = [];

        const bisf = Num.parseIntStrict(this.getScalar(this.state, 'mol-in-gp-bisf', ''));
        const repInt = Num.parseFloatStrict(this.getScalar(this.state, 'mol-in-gp-reporting-interval', ''));
        const numReps = Num.parseIntStrict(this.getScalar(this.state, 'mol-in-gp-num-reports', ''));
        const temp = Num.parseFloatStrict(this.getScalar(this.state, 'mol-in-gp-temperature', ''));
        const useDefMd = this.getScalar(this.state, 'mol-in-gp-def-md-params', false);
        const stage = this.getScalar(this.state, 'mol-in-gp-stage', NaN);

        if (isNaN(bisf))
            errors.push('Base interaction scale factor must be a number');
        if (isNaN(repInt))
            errors.push('Report interval must be a number');
        if (isNaN(numReps))
            errors.push('Number of reports must be a number');
        if (isNaN(temp))
            errors.push('Temperature must be a number');
        if (isNaN(stage))
            errors.push('Stage is not a valid number');

        errors = errors.concat(this.getErrors(this.state, 'mol-adv-params'));

        if (errors.length > 0) {
            throw errors;
        }

        const global = new GlobalConfig(bisf, false, temp);
        const mdParameters = new MdParameters(useDefMd);
        const reporting = new Reporting(repInt, numReps);

        const compounds = this.getArray<Compound[]>(this.state, 'mol-in-cp-added');
        const doubleHelices = this.getArray<DoubleHelix[]>(this.state, 'mol-in-dh-added');
        const baseInteractions = this.getArray<BaseInteraction[]>(this.state, 'mol-in-bi-added');
        const ntcs = this.getArray<NtCConformation[]>(this.state, 'mol-in-ntcs-added');
        const mobilizers = this.getArray<Mobilizer[]>(this.state, 'mol-in-mobilizers-added');
        const advValues = this.getScalar(this.state, 'mol-adv-params', new Map<ParameterNames, unknown>());

        return {
            global,
            reporting,
            stages: { first: stage, last: stage },
            compounds,
            doubleHelices,
            baseInteractions,
            ntcs,
            mobilizers,
            mdParameters,
            advParams: { parameters: Parameters, values: advValues },
        };
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
                    {this.props.mode === 'maverick'
                     ?
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
                     :
                     <>
                         <CompoundsInput ctxData={ctxData} />
                         <DoubleHelicesInput ctxData={ctxData} />
                         <BaseInteractionsInput ctxData={ctxData} />
                         <NtCsInput ctxData={ctxData} />
                         {this.isAdv() ? <MobilizersInput ctxData={ctxData} /> : undefined}
                         <GlobalParametersInput ctxData={ctxData}
                             availableStages={this.props.availableStages} />
                         {this.isAdv()
                          ?
                          (
                              <>
                                  <AdvancedMmbOptions ctxData={ctxData} />
                                  {this.makeMmbCommands()}
                              </>
                          )
                          :
                          undefined
                         }
                     </>
                    }
                </form>
            </this.Ctx.Provider>
        );
    }
}

export namespace MmbInputForm {
    export interface Props extends MIM.Props {
        availableStages: number[];
        currentStage: number|null;
        mode: MIM.UiMode;
    }
}