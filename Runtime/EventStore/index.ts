import { MongoClient } from 'mongodb';
import { configureLogging } from './Logging';
import { Container } from 'typescript-ioc';
import { ILogger } from './ILogger';

configureLogging();
const logger = Container.get(ILogger);

(async () => {
    const client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });

    logger.info('Connect');

    try {
        const result = await client.connect();
        logger.info('Connected');
        const db = client.db('eventstore_02');

        
    } catch (e) {
        logger.error(`Couldn't connect to Mongo : '${e}'`);
    }
})();

