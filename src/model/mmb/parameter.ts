/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Comparable } from '../../util/comparable';

export namespace Parameter {
    export type Type = 'integral' | 'real' | 'boolean' | 'textual' | 'options';
    export type Kind = 'static' | 'dynamic';
    export type ArgTypes = string|number|boolean|Comparable|undefined;
    export type DynValTypes = Range|TextualValidator|string[]|undefined;

    export abstract class Argument {
        constructor(readonly type: Type) {
        }
    }

    abstract class TypedArgument<T extends ArgTypes, P, SELF> extends Argument {
        constructor(readonly type: Type) {
            super(type);
        }

        abstract asDynamic(params: P|undefined): SELF;
        abstract chkType(v: unknown): v is T;
        abstract default(): T|undefined;
        abstract isValid(v: T): boolean;
        abstract options(): string[]|undefined;
    }

    export type LimitCondition = 'exclusive' | 'inclusive';
    abstract class Limit {
        constructor(readonly value: number, readonly condition: LimitCondition) {
        }

        abstract meets(v: number): boolean;
    }

    export class Min extends Limit {
        meets(v: number) {
            return this.condition === 'inclusive' ? v >= this.value : v > this.value;
        }
    }

    export class Max extends Limit {
        meets(v: number) {
            return this.condition === 'inclusive' ? v <= this.value : v < this.value;
        }
    }

    export class Range {
        constructor(readonly min?: Min, readonly max?: Max) {
        }

        isWithin(v: number) {
            if (this.min !== undefined && !this.min.meets(v))
                return false;
            if (this.max !== undefined && !this.max.meets(v))
                return false;
            return true;
        }
    }
    export const FullRange = new Range();
    export const PositiveRange = new Range(new Min(0, 'exclusive'), undefined);
    export const EZeroEOneRange = new Range(new Min(0, 'exclusive'), new Max(1, 'exclusive'));
    export const EZeroIOneRange = new Range(new Min(0, 'exclusive'), new Max(1, 'inclusive'));
    export const IZeroIOneRange = new Range(new Min(0, 'inclusive'), new Max(1, 'inclusive'));

    export class IntegralArgument extends TypedArgument<number, Range, IntegralArgument> {
        constructor(readonly range = FullRange, private readonly defaultValue?: number) {
            super('integral');
            if (defaultValue && !this.isValid(defaultValue))
                throw new Error('Default value of parameter is invalid');
        }

        asDynamic(range: Range|undefined) {
            return new IntegralArgument(range);
        }

        chkType(v: unknown): v is number {
            return typeof v === 'number';
        }

        default(): number {
            if (this.defaultValue)
                return this.defaultValue;
            if (this.range.min === undefined)
                return 0;
            return this.range.min.value;
        }

        isValid(v: number) {
            if (isNaN(v))
                return false;
            if (Math.round(v) !== v)
                return false;

            return this.range.isWithin(v);
        }

        options() {
            if (this.range.min === undefined || this.range.max === undefined)
                return undefined;

            const opts = new Array<string>();
            if (this.range.min.condition === 'inclusive')
                opts.push(this.range.min.value.toString());
            for (let i = this.range.min.value + 1; i < this.range.max.value; i++)
                opts.push(i.toString());
            if (this.range.max.condition === 'inclusive')
                opts.push(this.range.max.value.toString());

            return opts;
        }

    }

    export class RealArgument extends TypedArgument<number, Range, RealArgument> {
        constructor(readonly range = FullRange, private readonly defaultValue?: number) {
            super('real');
            if (defaultValue && !this.isValid(defaultValue))
                throw new Error('Default value of parameter is invalid');

        }

        asDynamic(range: Range|undefined) {
            return new RealArgument(range ? range : this.range);
        }

        chkType(v: unknown): v is number {
            return typeof v === 'number';
        }

        default(): number {
            if (this.defaultValue)
                return this.defaultValue;
            if (this.range.min === undefined)
                return 0;
            return this.range.min.value;
        }

        isValid(v: number) {
            if (isNaN(v))
                return false;
            return this.range.isWithin(v);
        }

        options() {
            return undefined;
        }
    }

    export class BooleanArgument extends TypedArgument<boolean, undefined, BooleanArgument> {
        constructor(private readonly defaultValue?: boolean) {
            super('boolean');
            if (defaultValue && !this.isValid(defaultValue))
                throw new Error('Default value of parameter is invalid');
        }

        asDynamic() {
            return new BooleanArgument();
        }

        chkType(v: unknown): v is boolean {
            return typeof v === 'boolean';
        }

        default(): boolean {
            if (this.defaultValue)
                return this.defaultValue;
            return false;
        }

        isValid(_v: boolean) {
            return true;
        }

        options() {
            return [ 'false', 'true' ];
        }
    }

    export interface TextualValidator {
        (v: string): boolean;
    }
    export const AllOkTextualValidator = (_s: string) => true;

    export class TextualArgument extends TypedArgument<string, TextualValidator, TextualArgument> {
        constructor(readonly validator: TextualValidator = AllOkTextualValidator, private readonly defaultValue?: string) {
            super('textual');
            if (defaultValue && !this.isValid(defaultValue))
                throw new Error('Default value of parameter is invalid');
        }

        asDynamic(validator: TextualValidator|undefined) {
            return new TextualArgument(validator ? validator : this.validator);
        }

        chkType(v: unknown): v is string {
            return typeof v === 'string';
        }

        default(): string {
            if (this.defaultValue)
                return this.defaultValue;
            return '';
        }

        isValid(v: string) {
            return this.validator(v);
        }

        options() {
            return undefined;
        }
    }

    export class OptionsArgument<O extends string> extends TypedArgument<O, O[], OptionsArgument<O>> {
        constructor(readonly opts: O[]) {
            super('options');
        }

        asDynamic(opts: O[]|undefined) {
            return new OptionsArgument(opts ? opts : this.opts);
        }

        chkType(v: unknown): v is O {
            if (typeof v !== 'string')
                return false;
            return this.opts.some(o => o === v);
        }

        default(): O|undefined {
            return this.opts[0];
        }

        isValid(v: string) {
            return this.opts.includes(v as O);
        }

        options() {
            return this.opts;
        }
    }

    export abstract class Parameter<K extends (string extends K ? never : string)> {
        constructor(readonly name: K, readonly description: string, readonly kind: Kind) {
        }

        abstract getType(): Type;
    }

    abstract class DynamicParameter<K extends (string extends K ? never : string), T extends ArgTypes, P, ARG extends TypedArgument<T, P, ARG>> extends Parameter<K> {
        constructor(readonly name: K, readonly description: string, private readonly argument: ARG) {
            super(name, description, 'dynamic');
        }

        getArgument(params: P|undefined): ARG {
            return this.argument.asDynamic(params);
        }

        getType() {
            return this.argument.type;
        }
    }

    export class IntegralDynamicParameter<K extends (string extends K ? never : string)> extends DynamicParameter<K, number, Range, IntegralArgument> {
        constructor(name: K, description: string) {
            super(name, description, new IntegralArgument());
        }
    }

    export class RealDynamicParameter<K extends (string extends K ? never : string)> extends DynamicParameter<K, number, Range, RealArgument> {
        constructor(name: K, description: string) {
            super(name, description, new RealArgument());
        }
    }

    export class BooleanDynamicParameter<K extends (string extends K ? never : string)> extends DynamicParameter<K, boolean, void, BooleanArgument> {
        constructor(name: K, description: string) {
            super(name, description, new BooleanArgument());
        }
    }

    export class TextualDynamicParameter<K extends (string extends K ? never : string)> extends DynamicParameter<K, string, TextualValidator, TextualArgument> {
        constructor(name: K, description: string) {
            super(name, description, new TextualArgument());
        }
    }

    export class OptionsDynamicParameter<K extends (string extends K ? never : string), O extends string> extends DynamicParameter<K, O, O[], OptionsArgument<O>> {
        constructor(name: K, description: string) {
            super(name, description, new OptionsArgument([]));
        }
    }

    export class StaticParameter<K extends (string extends K ? never : string)> extends Parameter<K> {
        constructor(readonly name: K, readonly description: string, private readonly argument: Argument) {
            super(name, description, 'static');
        }

        getArgument() {
            return this.argument;
        }

        getType() {
            return this.argument.type;
        }
    }

    export function isDynamicIntegral<K extends (string extends K ? never : string)>(param: Parameter<K>): param is IntegralDynamicParameter<K> {
        return param.getType() === 'integral' && param.kind === 'dynamic';
    }

    export function isDynamicReal<K extends (string extends K ? never : string)>(param: Parameter<K>): param is RealDynamicParameter<K> {
        return param.getType() === 'real' && param.kind === 'dynamic';
    }

    export function isDynamicBoolean<K extends (string extends K ? never : string)>(param: Parameter<K>): param is BooleanDynamicParameter<K> {
        return param.getType() === 'boolean' && param.kind === 'dynamic';
    }

    export function isDynamicTextual<K extends (string extends K ? never : string)>(param: Parameter<K>): param is TextualDynamicParameter<K> {
        return param.getType() === 'textual' && param.kind === 'dynamic';
    }

    export function isDynamicOptions<K extends (string extends K ? never : string), O extends string>(param: Parameter<K>): param is OptionsDynamicParameter<K, O> {
        return param.getType() === 'options' && param.kind === 'dynamic';
    }

    export function isStatic<K extends (string extends K ? never : string)>(param: Parameter<K>): param is StaticParameter<K> {
        return param.kind === 'static';
    }

    export function isIntegralArg(arg: Argument): arg is IntegralArgument {
        return arg.type === 'integral';
    }

    export function isRealArg(arg: Argument): arg is RealArgument {
        return arg.type === 'real';
    }

    export function isBooleanArg(arg: Argument): arg is BooleanArgument {
        return arg.type === 'boolean';
    }

    export function isTextualArg(arg: Argument): arg is TextualArgument {
        return arg.type === 'textual';
    }

    export function isOptionsArg<O extends (string extends O ? never : string)>(arg: Argument): arg is OptionsArgument<O> {
        return arg.type === 'options';
    }
}
