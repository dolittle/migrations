// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { prop, modelOptions, Severity, getModelForClass } from '@typegoose/typegoose';
import { ObjectId } from 'mongodb';
import { guid } from '../guid';
import { Connection, Model, Document } from 'mongoose';

@modelOptions({ schemaOptions: { collection: 'aggregates' }, options: { allowMixed: Severity.ALLOW } })
export class AggregateVersion {
    @prop()
    _id?: ObjectId;

    @guid()
    EventSource!: Guid;

    @guid()
    AggregateType!: Guid;

    @prop()
    Version!: number;
}

export const AggregateModel = getModelForClass(AggregateVersion);

export function getAggregateVersionModelFor(connection: Connection): Model<Document> {
    return connection.model('Aggregate', AggregateModel.schema);
}
