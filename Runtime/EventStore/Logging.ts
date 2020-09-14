// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

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
    Container.bind(ILogger).factory(() => {
        return logger;
    });
}
