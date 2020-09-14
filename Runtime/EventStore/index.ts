// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import mongoose from 'mongoose';
import { configureLogging } from './Logging';
import { Container } from 'typescript-ioc';
import { ILogger } from './ILogger';

import { CommitModel, getCommitModelFor, Commit } from './v4/Commit';

configureLogging();
const logger = Container.get(ILogger);

(async () => {

    // Aggregate Version - v5

    logger.info('Connect');

    try {
        const connection = await mongoose.createConnection('mongodb://localhost:27018', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'eventstore_02',
            useFindAndModify: false
        });

        logger.info('Connected');

        logger.info(CommitModel.collection.name);

        const commitModel = getCommitModelFor(connection);

        const total = await commitModel.countDocuments();
        logger.info(`Will convert ${total} commits into events`);
        const cursor = await commitModel.find().cursor();

        let first = true;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const commit = doc as Commit;
            logger.info(commit.correlation_id);
            logger.info(commit.events[0].event_artifact);
            

            //process.stdout.write('.');
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

