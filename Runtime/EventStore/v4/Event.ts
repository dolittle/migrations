// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { ExecutionContext } from './ExecutionContext';
import { guid } from '../guid';
import { prop } from '@typegoose/typegoose';

export class Event {
    @guid(false)
    _id?: Guid;

    @guid(false)
    correlation_id!: Guid;

    @guid(false)
    event_artifact!: Guid;

    @prop()
    generation!: 1;

    @guid(false)
    event_source_artifact!: Guid;

    @guid(false)
    eventsource_id!: Guid;

    @prop()
    commit!: number;

    @prop()
    sequence!: number;

    @prop()
    occurred!: number;

    @prop({ _id: false, type: ExecutionContext })
    original_context!: ExecutionContext;

    @prop()
    event!: any;
}

