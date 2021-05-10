/**
 * Copyright (c) 2020 WebMMB contributors, licensed under MIT, See LICENSE file for details.
 *
 * @author Michal Malý (michal.maly@ibt.cas.cz)
 * @author Samuel C. Flores (samuelfloresc@gmail.com)
 * @author Jiří Černý (jiri.cerny@ibt.cas.cz)
 */

import { AppRequest } from './app-request';
import { ResponseDeserializers } from './response-deserializers';
import { Query as Q } from './query';

export namespace AppQuery {
    export function activateExample(name: string) {
        return Q.query(() => AppRequest.activateExample(name), ResponseDeserializers.toJobInfo, 'Cannot activate example');
    }

    export function listExamples() {
        return Q.query(() => AppRequest.listExamples(), ResponseDeserializers.toExampleList, 'Cannot get list of examples');
    }
}
