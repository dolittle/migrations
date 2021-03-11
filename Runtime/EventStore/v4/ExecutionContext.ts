// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';

import { Claim } from './Claim';
import { guidFromBinary } from './guidFromBinary';

export class ExecutionContext {
    readonly application: Guid;
    readonly bounded_context: Guid;
    readonly tenant: Guid;
    readonly environment: string;
    readonly claims: readonly Claim[];

    constructor(raw: any) {
        this.application = guidFromBinary(raw.application);
        this.bounded_context = guidFromBinary(raw.bounded_context);
        this.tenant = guidFromBinary(raw.tenant);
        this.environment = raw.environment;
        this.claims = raw.claims.map((raw: any) => new Claim(raw));
    }
}
