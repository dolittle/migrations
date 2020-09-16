// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Connection, Model, Document } from 'mongoose';
import { getCommitModelFor, Commit } from './v4/Commit';
import { Event as v4Event } from './v4/Event';
import { getEventModelFor, Event } from './v5/Event';
import { Guid } from '@dolittle/rudiments';
import { Binary } from 'mongodb';
import { getAggregateVersionModelFor, AggregateVersion } from './v5/AggregateVersion';
import { mongoose } from '@typegoose/typegoose';
import { ILogger } from './ILogger';
import { Claim } from './v5/Claim';

export type EventModifierCallback = (sourceEvent: v4Event, destinationEvent: Event) => boolean;

export class EventStoreConverter {
    private _commitModel: Model<Document>;
    private _eventModel: Model<Document>;
    private _aggregateModel: Model<Document>;

    constructor(
        private readonly _sourceConnection: Connection,
        private readonly _destinationConnection: Connection,
        private readonly _logger: ILogger,
        private readonly _modifierCallback: EventModifierCallback = (s, d) => true) {
        this._commitModel = getCommitModelFor(_sourceConnection);
        this._eventModel = getEventModelFor(_destinationConnection);
        this._aggregateModel = getAggregateVersionModelFor(_destinationConnection);
    }

    async convert() {
        await this.dropExistingCollections();
        await this.createCollections();

        const total = await this._commitModel.countDocuments();
        this._logger.info(`Starting to convert ${total} commits into events`);

        const cursor = await this._commitModel.find().cursor();

        let sequenceNumber = 0;
        let docCount = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const commit = doc as Commit;

            for (const sourceEvent of commit.events) {


                const destinationEvent = new Event();
                destinationEvent._id = sequenceNumber;
                destinationEvent.ExecutionContext = this.getExecutionContextFrom(sourceEvent);
                destinationEvent.Metadata = this.getMetadataFrom(sourceEvent);
                destinationEvent.Aggregate = this.getAggregateFrom(sourceEvent);
                destinationEvent.EventHorizon = this.getEmptyEventHorizon();
                destinationEvent.Content = this.getContentFrom(sourceEvent);

                this.getContentFrom(sourceEvent);

                if (this._modifierCallback(sourceEvent, destinationEvent)) {
                    destinationEvent.Aggregate.Version = await this.getAggregateVersionFor(sourceEvent);

                    await this._eventModel.create(destinationEvent);

                    process.stdout.write('.');
                    sequenceNumber++;
                }
            }

            docCount++;
        }

        this._logger.info('');
        this._logger.info(`Converted ${docCount} commits into ${sequenceNumber} events`);
    }

    private getContentFrom(sourceEvent: v4Event) {
        const content: any = {};
        for (const property in sourceEvent.event) {
            const camelCasePropertyName = property.toCamelCase();
            const value = sourceEvent.event[property];
            if (value instanceof Binary) {
                const binaryValue = value as Binary;
                if (binaryValue.buffer.length === 16) {
                    const guid = binaryValue.toGuid();
                    content[camelCasePropertyName] = guid.toString();
                } else {
                    content[camelCasePropertyName] = btoa(String.fromCharCode(...new Uint8Array(binaryValue.buffer)));
                }
            } else {
                content[camelCasePropertyName] = value.toString();
            }
        }
        return content;
    }

    private getMetadataFrom(sourceEvent: v4Event) {
        return {
            Occurred: new Date(sourceEvent.occurred),
            EventSource: sourceEvent.eventsource_id,
            TypeId: sourceEvent.event_artifact,
            TypeGeneration: 1,
            Public: false
        };
    }

    private getExecutionContextFrom(sourceEvent: v4Event) {
        return {
            Correlation: sourceEvent.correlation_id,
            Microservice: sourceEvent.original_context.bounded_context,
            Tenant: sourceEvent.original_context.tenant,
            Version: {
                Major: 0,
                Minor: 0,
                Patch: 0,
                Build: 0,
                PreRelease: ''
            },
            Environment: sourceEvent.original_context.environment,
            Claims: [] as Claim[]
        };
    }

    private getAggregateFrom(sourceEvent: v4Event) {
        return {
            WasAppliedByAggregate: true,
            TypeId: sourceEvent.event_source_artifact,
            TypeGeneration: 1,
            Version: 0
        };
    }

    private getEmptyEventHorizon() {
        return {
            FromEventHorizon: false,
            ExternalEventLogSequenceNumber: 0,
            Received: new Date(0),
            Consent: Guid.empty
        };
    }

    private async getAggregateVersionFor(sourceEvent: v4Event): Promise<number> {

        const aggregateVersionCriteria = {
            AggregateType: sourceEvent.event_source_artifact,
            EventSource: sourceEvent.eventsource_id
        };
        const hasAggregate = await this._aggregateModel.exists(aggregateVersionCriteria);

        let version: number = 1;

        if (!hasAggregate) {
            await this._aggregateModel.create({
                ...aggregateVersionCriteria,
                ...{
                    _id: new mongoose.mongo.ObjectId(),
                    Version: 1
                }
            });
        } else {
            await this._aggregateModel.updateOne(
                aggregateVersionCriteria,
                { $inc: { Version: 1 } }
            );

            const aggregateVersionDocument = await this._aggregateModel.findOne(aggregateVersionCriteria).exec();
            if (aggregateVersionDocument) {
                version = (aggregateVersionDocument as any as AggregateVersion).Version;
            }
        }

        return version;
    }

    private async dropExistingCollections() {
        try {
            await this._destinationConnection.dropCollection('event-log');
            await this._destinationConnection.dropCollection('aggregates');
        } catch (ex) {
            this._logger.info(`Problems dropping collections: ${ex}`)

        }
    }

    private async createCollections() {
        await this._destinationConnection.createCollection('event-log');
        await this._destinationConnection.createCollection('aggregates');
    }
}
