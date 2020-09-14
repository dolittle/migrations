// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { Claim } from './Claim';
import { Version } from './Version';

export class ExecutionContext {
    Correlation!: Guid;
    Microservice!: Guid;
    Tenant!: Guid;
    Version!: Version;
    Environment!: string;
    Claims!: Claim[];
}
