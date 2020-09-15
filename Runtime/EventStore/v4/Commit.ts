// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { prop, getModelForClass, modelOptions, Severity, ReturnModelType } from '@typegoose/typegoose';
import { guid } from '../guid';
import { Event } from './Event';
import { Connection, Model, Document } from 'mongoose';

@modelOptions({ schemaOptions: { collection: 'commits' }, options: { customName: 'CommitV4', allowMixed: Severity.ALLOW } })
export class Commit {
    @prop()
    _id?: number;

    @guid(false)
    correlation_id!: Guid;

    @guid(false)
    commit_id!: Guid;

    @prop()
    timestamp!: number;

    @guid(false)
    eventsource_id!: Guid;

    @guid(false)
    event_source_artifact!: Guid;

    @prop()
    commit!: number;

    @prop()
    sequence!: 0;

    @prop({ _id: false, type: Event })
    events!: Event[];
}

export const CommitModel = getModelForClass(Commit);

export function getCommitModelFor(connection: Connection): Model<Document> {
    return connection.model('Commit', CommitModel.schema);
}
