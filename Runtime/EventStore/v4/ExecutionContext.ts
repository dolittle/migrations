// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { Claim } from './Claim';
import { guid } from '../guid';
import { prop } from '@typegoose/typegoose';

export class ExecutionContext {
    @guid(false)
    application!: Guid;

    @guid(false)
    bounded_context!: Guid;

    @guid(false)
    tenant!: Guid;

    @prop()
    environment!: string;

    @prop({ _id: false, type: Claim })
    claims!: Claim[];
}
