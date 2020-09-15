// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { modelOptions, prop } from '@typegoose/typegoose';
import { guid } from '../guid';
import { Claim } from './Claim';
import { Version } from './Version';

@modelOptions({ options: { customName: 'ExecutionContextV5' } })
export class ExecutionContext {
    @guid()
    Correlation!: Guid;

    @guid()
    Microservice!: Guid;

    @guid()
    Tenant!: Guid;

    @prop({ _id: false, type: Version })
    Version!: Version;

    @prop()
    Environment!: string;

    @prop({ _id: false, type: Claim })
    Claims!: Claim[];
}
