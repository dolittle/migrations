// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';

import { Event } from './Event';
import { guidFromBinary } from './guidFromBinary';

export class Commit {
    readonly _id: number;
    readonly correlation_id: Guid;
    readonly commit_id: Guid;
    readonly timestamp: Date;
    readonly eventsource_id: Guid;
    readonly event_source_artifact: Guid;
    readonly commit: number;
    readonly sequence: number;
    readonly events: readonly Event[];

    constructor(raw: any) {
        this._id = raw._id;
        this.correlation_id = guidFromBinary(raw.correlation_id);
        this.commit_id = guidFromBinary(raw.commit_id);
        this.timestamp = new Date(raw.timestamp);
        this.eventsource_id = guidFromBinary(raw.eventsource_id);
        this.event_source_artifact = guidFromBinary(raw.event_source_artifact);
        this.commit = raw.commit;
        this.sequence = raw.sequence;
        this.events = raw.events.map((raw: any) => new Event(raw));
    }
}
