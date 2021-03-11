// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';

import { ExecutionContext } from './ExecutionContext';
import { guidFromBinary } from './guidFromBinary';

export class Event {
    readonly _id: Guid;
    readonly correlation_id: Guid;
    readonly event_artifact: Guid;
    readonly generation: number;
    readonly eventsource_id: Guid;
    readonly event_source_artifact: Guid;
    readonly commit: number;
    readonly sequence: number;
    readonly occurred: Date;
    readonly original_context: ExecutionContext;
    readonly event: any;

    constructor(raw: any) {
        this._id = guidFromBinary(raw._id);
        this.correlation_id = guidFromBinary(raw.correlation_id);
        this.event_artifact = guidFromBinary(raw.event_artifact);
        this.generation = raw.generation;
        this.eventsource_id = guidFromBinary(raw.eventsource_id);
        this.event_source_artifact = guidFromBinary(raw.event_source_artifact);
        this.commit = raw.commit;
        this.sequence = raw.sequence;
        this.occurred = new Date(raw.occurred);
        this.original_context = new ExecutionContext(raw.original_context);
        this.event = raw.event;
    }
}
