// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { ExecutionContext } from './ExecutionContext';
import { EventMetadata } from "./EventMetadata";
import { Aggregate } from "./Aggregate";
import { EventHorizon } from "./EventHorizon";
import { prop, getModelForClass, modelOptions, Severity } from '@typegoose/typegoose';
import { guid } from '../guid';
import { Connection, Model, Document } from 'mongoose';

@modelOptions({ schemaOptions: { collection: 'event-log' }, options: { allowMixed: Severity.ALLOW } })
export class Event {
    @prop()
    _id?: number;

    @guid()
    Partition!: Guid;

    @prop({ _id: false, type: ExecutionContext })
    ExecutionContext!: ExecutionContext;

    @prop({ _id: false, type: EventMetadata })
    Metadata!: EventMetadata;

    @prop({ _id: false, type: Aggregate })
    Aggregate!: Aggregate;

    @prop({ _id: false, type: EventHorizon })
    EventHorizon!: EventHorizon;

    @prop()
    Content: any;
}

export const EventModel = getModelForClass(Event);

export function getEventModelFor(connection: Connection): Model<Document> {
    return connection.model('Event', EventModel.schema);
}
