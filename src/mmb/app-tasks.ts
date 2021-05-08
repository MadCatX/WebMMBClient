/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AppQuery } from './app-query';
import { ResponseDeserializers } from './response-deserializers';
import { Tasks as T } from './tasks';

export namespace AppTasks {
    export function activateExample(name: string) {
        return T.task(() => AppQuery.activateExample(name), ResponseDeserializers.toJobInfo, 'Cannot activate example');
    }

    export function listExamples() {
        return T.task(() => AppQuery.listExamples(), ResponseDeserializers.toExampleList, 'Cannot get list of examples');
    }
}
