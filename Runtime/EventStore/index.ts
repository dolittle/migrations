// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export { EventStoreConverter } from './EventStoreConverter';
export { ILogger } from './ILogger';

import { configureLogging } from './Logging';
import { Container } from 'typescript-ioc';
import { ILogger } from './ILogger';
import './StringExtensions';

configureLogging();
export const logger = Container.get(ILogger);


import mongoose from 'mongoose';
import { EventStoreConverter } from './EventStoreConverter';

(async () => {
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

        logger.info('Connected');

        const converter = new EventStoreConverter(sourceConnection, destinationConnection, logger);
        await converter.convert();

    } catch (e) {
        logger.error(`Couldn't connect to Mongo : '${e}'`);
    }
})();
