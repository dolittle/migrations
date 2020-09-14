// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import mongoose from 'mongoose';
import { configureLogging } from './Logging';
import { Container } from 'typescript-ioc';
import { ILogger } from './ILogger';

import { CommitModel, getCommitModelFor, Commit } from './v4/Commit';
import { getEventModelFor, Event } from './v5/Event';
import { Guid } from '@dolittle/rudiments';
import { Binary } from 'mongodb';
import './StringExtensions';
import { getAggregateVersionModelFor, AggregateVersion } from './v5/AggregateVersion';
import { ObjectId } from 'mongodb';

configureLogging();
const logger = Container.get(ILogger);


(async () => {

    // Aggregate Version - v5

    logger.info('Connect');

    try {
        const sourceConnection = await mongoose.createConnection('mongodb://localhost:27018', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'eventstore_02',
            useFindAndModify: false
        });

        const destinationConnection = await mongoose.createConnection('mongodb://localhost:27017', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'eventstore_02',
            useFindAndModify: false
        });

        for (const collection in destinationConnection.collections) {
            logger.info(`Dropping ${collection}`);
            //destinationConnection.dropCollection(collection);
        }

        destinationConnection.dropCollection('event-log');
        destinationConnection.dropCollection('aggregates');

        logger.info('Connected');
        const commitModel = getCommitModelFor(sourceConnection);
        const eventModel = getEventModelFor(destinationConnection);
        const aggregateModel = getAggregateVersionModelFor(destinationConnection);

        const total = await commitModel.countDocuments();
        logger.info(`Starting to convert ${total} commits into events`);
        const cursor = await commitModel.find().cursor();

        let sequenceNumber = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const commit = doc as Commit;

            for (const sourceEvent of commit.events) {
                const destinationEvent = new Event();
                destinationEvent._id = sequenceNumber
                destinationEvent.ExecutionContext = {
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
                    Claims: []
                };

                destinationEvent.Metadata = {
                    Occurred: new Date(sourceEvent.occurred),
                    EventLogSequenceNumber: sequenceNumber,
                    EventSource: sourceEvent.eventsource_id,
                    TypeId: sourceEvent.event_artifact,
                    TypeGeneration: 1,
                    Public: false
                };

                destinationEvent.Aggregate = {
                    WasAppliedByAggregate: true,
                    TypeId: sourceEvent.event_source_artifact,
                    TypeGeneration: 1,
                    Version: 0
                };

                destinationEvent.EventHorizon = {
                    FromEventHorizon: false,
                    ExternalEventLogSequenceNumber: 0,
                    Received: new Date(0),
                    Consent: Guid.empty
                };

                destinationEvent.Content = {};

                for (const property in sourceEvent.event) {
                    const camelCasePropertyName = property.toCamelCase();
                    const value = sourceEvent.event[property];
                    if (value instanceof Binary) {
                        const binaryValue = value as Binary;
                        if (binaryValue.buffer.length === 16) {
                            const guid = binaryValue.toGuid();
                            destinationEvent.Content[camelCasePropertyName] = guid.toString();
                        } else {
                            let base64String = btoa(String.fromCharCode(...new Uint8Array(binaryValue.buffer)));
                            destinationEvent.Content[camelCasePropertyName] = base64String;
                        }
                    } else {
                        destinationEvent.Content[camelCasePropertyName] = value.toString();
                    }
                }

                const aggregateVersionCriteria = {
                    AggregateType: sourceEvent.event_source_artifact,
                    EventSource: sourceEvent.eventsource_id
                };
                const hasAggregate = await aggregateModel.exists(aggregateVersionCriteria);

                let version: number = 1;

                if (!hasAggregate) {
                    await aggregateModel.create({
                        ...aggregateVersionCriteria,
                        ...{
                            _id: new mongoose.mongo.ObjectId(),
                            Version: 1
                        }
                    });
                } else {
                    await aggregateModel.update(
                        aggregateVersionCriteria,
                        { $inc: { Version: 1 } }
                    );

                    const aggregateVersionDocument = await aggregateModel.findOne(aggregateVersionCriteria).exec();
                    if (aggregateVersionDocument) {
                        version = (aggregateVersionDocument as any as AggregateVersion).Version;
                    }
                }

                destinationEvent.Aggregate.Version = version;

                await eventModel.create(destinationEvent);

                process.stdout.write('.');

                sequenceNumber++;
            }
        }
    } catch (e) {
        logger.error(`Couldn't connect to Mongo : '${e}'`);
    }
})();

