import { Container } from 'typescript-ioc';
import { createLogger, format, transports } from 'winston';
import { ILogger } from './ILogger';

export function configureLogging() {
    const loggerOptions = {
        level: 'debug',
        format: format.colorize(),
        defaultMeta: {
        },
        transports: [
            new transports.Console({
                format: format.simple()
            })
        ]
    };

    const logger = createLogger(loggerOptions);
    console.log('Bind');
    Container.bind(ILogger).factory(() => {
        console.log('Factory');
        return logger;
    });
}
