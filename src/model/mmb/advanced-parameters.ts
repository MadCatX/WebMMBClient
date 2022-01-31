/**
 * Copyright (c) 2020-2022 WebMMB contributors, licensed under MIT, See LICENSE file for defails.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { Parameter as P } from './parameter';
import { FileInputParameterNames, ParameterNames, Parameters } from '../../mmb/available-parameters';
import { AdditionalFile } from '../../model/mmb/additional-file';
import { Cloneable } from '../../util/cloneable';
import { Comparable } from '../../util/comparable';

export namespace AdvancedParameters {
    function undefinedMatch(a: unknown, b: unknown) {
        return (a === undefined && b === undefined) || (a !== undefined && b !== undefined);
    }

    function cmpKeys(a: ParameterNames[], b: ParameterNames[]) {
        if (a.length !== b.length)
            return false;
        for (const k of a) {
            if (!b.includes(k))
                return false;
        }

        return true;
    }

    function isPrimitive(v: unknown): v is string|number|boolean {
        return (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
    }

    export class Type extends Map<ParameterNames, P.ArgTypes> implements Comparable, Cloneable {
        clone() {
            const fresh = new Type();

            for (const [k, v] of this.entries())
                fresh.set(k, v);

            return fresh;
        }

        equals(other: Type) {
            if (!cmpKeys(Array.from(other.keys()), Array.from(this.keys())))
                return false;

            for (const k of this.keys()) {
                const v1 = this.get(k);
                const v2 = other.get(k);
                let equal = false;
                if (!undefinedMatch(v1, v2))
                    return false;
                if (isPrimitive(v1) || isPrimitive(v2))
                    equal = v1 === v2;
                else
                    equal = !(v1 as Comparable).equals(v2 as Comparable);
                if (!equal)
                    return false;
            }

            return true;
        }
    }

    export type Data = {
        additionalFiles: AdditionalFile[];
    }

    export function getArgument(param: P.Parameter<ParameterNames>, data: Data) {
        if (P.isStatic(param)) {
            const arg = param.getArgument();
            if (P.isIntegralArg(arg) ||
                P.isRealArg(arg) ||
                P.isBooleanArg(arg) ||
                P.isTextualArg(arg) ||
                P.isOptionsArg(arg))
                return arg;
        } else if (P.isDynamicIntegral(param) ||
                   P.isDynamicReal(param)) {
            const dynVals = getDynValsFor(param, data);
            return param.getArgument(dynVals as P.Range);
        } else if (P.isDynamicBoolean(param)) {
            return param.getArgument();
        } else if (P.isDynamicTextual(param)) {
            const dynVals = getDynValsFor(param, data);
            return param.getArgument(dynVals as P.TextualValidator);
        } else if (P.isDynamicOptions(param)) {
            const dynVals = getDynValsFor(param, data);
            return param.getArgument(dynVals as string[]);
        }

        throw new Error('Invalid parameter type');
    }

    export function getDynValsFor(param: P.Parameter<ParameterNames>, data: Data): P.DynValTypes {
        if (isFileInputParameter(param.name)) {
            const files = data.additionalFiles;
            return files.map(f => f.name);
        } else
            return void 0;
    }

    export function isFileInputParameter(name: ParameterNames) {
        return FileInputParameterNames.includes(name);
    }

    export function isParameterName(v: string): v is ParameterNames {
        for (const k of Parameters.keys()) {
            if (k === v)
                return true;
        }

        return false;
    }
}
