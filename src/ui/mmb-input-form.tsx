/**
 * Copyright (c) 2020-2021 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { AdvancedMmbOptions } from './advanced-mmb-options';
import { FormContextManager as FCM } from '../model/common/form-context-manager';
import { Form } from './common/form/form';
import { BaseInteractionsInput } from './base-interactions-input';
import { CompoundsInput } from './compounds-input';
import { DoubleHelicesInput } from './double-helices-input';
import { GlobalParametersInput } from './global-parameters-input';
import { NtCsInput } from './ntcs-input';
import { ParameterNames, Parameters } from '../mmb/available-parameters';
import { CommandsSerializer, JsonCommandsSerializer, TextCommandsSerializer } from '../mmb/commands-serializer';
import { GlobalConfig } from '../model/global-config';
import { Reporting } from '../model/reporting';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { MmbInputModel as MIM } from '../model/mmb-input-model';
import { NtCConformation } from '../model/ntc-conformation';
import { MdParameters } from '../model/md-parameters';
import { JobNameInput } from './job-name-input';
import { MmbCommands } from './mmb-commands';
import { Num } from '../util/num';

export class MmbInputForm extends Form<MIM.ErrorKeys, MIM.ValueKeys, MIM.ValueTypes, MmbInputForm.Props> {
    private Ctx: React.Context<MIM.ContextData>;

    constructor(props: MmbInputForm.Props) {
        super(props);

        this.state = {
            ...this.initialBaseState(),
        };

        this.Ctx = FCM.makeContext();
    }

    commandsToJob() {
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
        }

        const commands = JsonCommandsSerializer.serialize(this.makeParams());

        return { name, commands };
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
        if (this.props.availableStages.length !== prevProps.availableStages.length) {
            const v = this.emptyValues();
            v.set('mol-in-gp-stage', this.props.availableStages.length);
            this.setValues(new Map([...this.state.values, ...v]));
        }
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
        const advValues = this.getScalar(this.state, 'mol-adv-params', new Map<ParameterNames, unknown>());

        return {
            global,
            reporting,
            stages: { first: stage, last: stage },
            compounds,
            doubleHelices,
            baseInteractions,
            ntcs,
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
                    <CompoundsInput ctxData={ctxData} />
                    <DoubleHelicesInput ctxData={ctxData} />
                    <BaseInteractionsInput ctxData={ctxData} />
                    <NtCsInput ctxData={ctxData} />
                    <GlobalParametersInput ctxData={ctxData} availableStages={this.props.availableStages} />
                    <AdvancedMmbOptions ctxData={ctxData} />
                    {this.makeMmbCommands()}
                </form>
            </this.Ctx.Provider>
        );
    }
}

export namespace MmbInputForm {
    export interface Props extends MIM.Props {
        availableStages: number[];
    }
}