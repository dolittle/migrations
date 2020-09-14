// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import mongoose from 'mongoose';
import { configureLogging } from './Logging';
import { Container } from 'typescript-ioc';
import { ILogger } from './ILogger';

import { CommitModel, getCommitModelFor, Commit } from './v4/Commit';
import { getEventModelFor, Event } from './v5/Event';
import { Guid } from '@dolittle/rudiments';

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

        logger.info('Connected');
        const commitModel = getCommitModelFor(sourceConnection);
        const eventModel = getEventModelFor(destinationConnection);

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

                destinationEvent.Content = sourceEvent.event

                logger.info(destinationEvent);

                await eventModel.create(destinationEvent);

                process.stdout.write('.');

                sequenceNumber++;
            }

            

            //logger.info(commit.correlation_id);
            //logger.info(commit.events[0].event_artifact);


            //
            break;
        }

        //connection.models




        //logger.info(await CommitModel.exists((_: any) => true));

        logger.info('Blah');

        /*
        const commits = await CommitModel.find().exec();
        logger.info('Fetched');

        for (const commit of commits) {
            logger.info(commit);

        }
        */


    } catch (e) {
        logger.error(`Couldn't connect to Mongo : '${e}'`);
    }
})();

