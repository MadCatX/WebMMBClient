/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

export namespace Parameter {
    export type Type = 'integral' | 'real' | 'boolean' | 'textual' | 'options';

    export abstract class Parameter<K extends (string extends K ? never : string)> {
        constructor(readonly name: K, readonly description: string, readonly type: Type) {
        }

        public abstract options(): string[] | undefined;
    }

    abstract class TypeCheckedParameter<K extends (string extends K ? never : string), T> extends Parameter<K> {
        public abstract chkType(v: unknown): v is T;
    }

    export type LimitCondition = 'exclusive' | 'inclusive';
    abstract class Limit {
        constructor(readonly value: number, readonly condition: LimitCondition) {
        }

        public abstract meets(v: number): boolean;
    }

    export class Min extends Limit {
        public meets(v: number) {
            return this.condition === 'inclusive' ? v >= this.value : v > this.value;
        }
    }

    export class Max extends Limit {
        public meets(v: number) {
            return this.condition === 'inclusive' ? v <= this.value : v < this.value;
        }
    }

    export class Range {
        constructor(readonly min?: Min, readonly max?: Max) {
        }

        public isWithin(v: number) {
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

    export class IntegralParameter<K extends (string extends K ? never : string)> extends TypeCheckedParameter<K, number> {
        constructor(name: K, description: string, readonly range = FullRange) {
            super(name, description, 'integral');
        }

        public chkType(v: unknown): v is number {
            return typeof v === 'number';
        }

        public default(): number {
            if (this.range.min === undefined)
                return 0;
            return this.range.min.value;
        }

        public isValid(v: number) {
            if (isNaN(v))
                return false;
            if (Math.round(v) !== v)
                return false;

            return this.range.isWithin(v);
        }

        public options() {
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

    export class RealParameter<K extends (string extends K ? never : string)> extends TypeCheckedParameter<K, number> {
        constructor(name: K, description: string, readonly range = FullRange) {
            super(name, description, 'real');
        }

        public chkType(v: unknown): v is number {
            return typeof v === 'number';
        }

        public default(): number {
            if (this.range.min === undefined)
                return 0;
            return this.range.min.value;
        }

        public isValid(v: number) {
            if (isNaN(v))
                return false;
            return this.range.isWithin(v);
        }

        public options() {
            return undefined;
        }
    }

    export class BooleanParameter<K extends (string extends K ? never : string)> extends TypeCheckedParameter<K, boolean> {
        constructor(name: K, description: string) {
            super(name, description, 'boolean');
        }

        public chkType(v: unknown): v is boolean {
            return typeof v === 'boolean';
        }

        public default(): boolean {
            return false;
        }

        public isValid(_v: boolean) {
            return true;
        }

        public options() {
            return [ 'false', 'true' ];
        }
    }

    export interface TextualValidator {
        (v: string): boolean;
    }
    export const AllOkTextualValidator = (_s: string) => true;

    export class TextualParameter<K extends (string extends K ? never : string)> extends TypeCheckedParameter<K, string> {
        constructor(name: K, description: string, readonly validator: TextualValidator = AllOkTextualValidator) {
            super(name, description, 'textual');
        }

        public chkType(v: unknown): v is string {
            return typeof v === 'string';
        }

        public isValid(v: string) {
            return this.validator(v);
        }

        public options() {
            return undefined;
        }
    }

    export class OptionsParameter<K extends (string extends K ? never : string), O extends (string extends O ? never : string)> extends TypeCheckedParameter<K, O> {
        constructor(name: K, description: string, readonly opts: O[]) {
            super(name, description, 'options');
        }

        public chkType(v: unknown): v is O {
            if (typeof v !== 'string')
                return false;
            return this.opts.some(o => o === v);
        }

        public default(): O {
            return this.opts[0];
        }

        public isValid(v: string) {
            return this.opts.includes(v as O);
        }

        public options() {
            return this.opts;
        }
    }

    export function isIntegral<K extends (string extends K ? never : string)>(param: Parameter<K>): param is IntegralParameter<K> {
        return param.type === 'integral';
    }

    export function isReal<K extends (string extends K ? never : string)>(param: Parameter<K>): param is RealParameter<K> {
        return param.type === 'real';
    }

    export function isBoolean<K extends (string extends K ? never : string)>(param: Parameter<K>): param is BooleanParameter<K> {
        return param.type === 'boolean';
    }

    export function isTextual<K extends (string extends K ? never : string)>(param: Parameter<K>): param is TextualParameter<K> {
        return param.type === 'textual';
    }

    export function isOptions<K extends (string extends K ? never : string), O extends (string extends O ? never : string)>(param: Parameter<K>): param is OptionsParameter<K, O> {
        return param.type === 'options';
    }
}
