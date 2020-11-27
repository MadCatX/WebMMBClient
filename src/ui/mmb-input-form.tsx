/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import * as React from 'react';
import { FormContextManager as FCM } from './form-context-manager';
import { MmbInputUtil as MmbUtil } from './mmb-input-form-util';
import { Form } from './common/form';
import { BaseInteractionsInput } from './base-interactions-input';
import { CompoundsInput } from './compounds-input';
import { DoubleHelicesInput } from './double-helices-input';
import { GlobalParametersInput } from './global-parameters-input';
import { NtCsInput } from './ntcs-input';
import { CommandsSerializer, JsonCommandsSerializer, TextCommandsSerializer } from '../mmb/commands-serializer';
import { GlobalConfig } from '../model/global-config';
import { Reporting } from '../model/reporting';
import { BaseInteraction } from '../model/base-interaction';
import { Compound } from '../model/compound';
import { DoubleHelix } from '../model/double-helix';
import { NtCConformation } from '../model/ntc-conformation';
import { MdParameters } from '../model/md-parameters';
import { JobNameInput } from './job-name-input';
import {MmbCommands} from './mmb-commands';
import { Num } from '../util/num';

export class MmbInputForm extends Form<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.ValueTypes, MmbUtil.Props> {
    constructor(props: MmbUtil.Props) {
        super(props);

        FCM.registerContext<MmbUtil.ErrorKeys, MmbUtil.ValueKeys, MmbUtil.ValueTypes>(props.id);
    }

    commandsToJob(lastCompletedStage: number) {
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

        const commands =  JsonCommandsSerializer.serialize(this.makeParams(2));

        return { name, commands };
    }

    private makeMmbCommands() {
        try {
            const cmds = TextCommandsSerializer.serialize(this.makeParams(2));

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

    componentWillUnmount() {
        FCM.unregisterContext(this.props.id);
    }

    private makeParams(stage: number): CommandsSerializer.Parameters {
        const errors: string[] = [];

        const bisf = Num.parseIntStrict(this.getScalar(this.state, 'mol-in-gp-bisf', ''));
        const repInt = Num.parseFloatStrict(this.getScalar(this.state, 'mol-in-gp-reporting-interval', ''));
        const numReps = Num.parseIntStrict(this.getScalar(this.state, 'mol-in-gp-num-reports', ''));
        const temp = Num.parseIntStrict(this.getScalar(this.state, 'mol-in-gp-temperature', ''));
        const useDefMd = this.getScalar(this.state, 'mol-in-gp-def-md-params', false);

        if (isNaN(bisf))
            errors.push('Base interaction scale factor must be a number');
        if (isNaN(repInt))
            errors.push('Report interval must be a number');
        if (isNaN(numReps))
            errors.push('Number of reports must be a number');
        if (isNaN(temp))
            errors.push('Temperature must be a number');

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

        return {
            global,
            reporting,
            stages: { first: stage, last: stage },
            compounds,
            doubleHelices,
            baseInteractions,
            ntcs,
            mdParameters,
        };
    }

    protected renderContent() {
        const ctxData: MmbUtil.ContextData = {
            ...this.state,
            setErrors: this.setErrors,
            setValues: this.setValues,
            setErrorsAndValues: this.setErrorsAndValues,
        };

        const Ctx = FCM.getContext(this.props.id);

        return (
            <Ctx.Provider value={ctxData}>
                <form>
                    <JobNameInput formId={this.props.id} name={this.props.jobName} />
                    <CompoundsInput formId={this.props.id} />
                    <DoubleHelicesInput formId={this.props.id} />
                    <BaseInteractionsInput formId={this.props.id} />
                    <NtCsInput formId={this.props.id} />
                    <GlobalParametersInput formId={this.props.id} />
                    {this.makeMmbCommands()}
                </form>
            </Ctx.Provider>
        );
    }
}