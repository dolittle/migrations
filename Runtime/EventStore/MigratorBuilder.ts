// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createLogger, format, Logger, transports } from 'winston';
import { ClientBuilder } from '@dolittle/sdk';

import { SourceBuilderCallback, SourcesBuilder } from './Sources';
import { Migrator } from './Migrator';
import { AggregateVersions } from './AggregateVersions';
import { ArtifactsMap, isArtifactsMap } from './Artifacts';
import { EventConverter, EventModifierCallback } from './EventConverter';

/**
 * Represents a builder for building {Migrator}.
 */
export class MigratorBuilder {
    private readonly _sourcesBuilder: SourcesBuilder;
    private _artifactsMap: ArtifactsMap = {};
    private _modifierCallback: EventModifierCallback = () => true;
    private _logger: Logger;

    /**
     * Creates an instance of migrator builder.
     */
    constructor(private readonly _clientBuilder: ClientBuilder) {
        this._sourcesBuilder = new SourcesBuilder();
        this._logger = createLogger({
            // level: 'info',
            level: 'debug',
            format: format.combine(
                format.timestamp({ format: 'HH:mm:ss' }),
                format.printf((log) => `${log.timestamp} ${log.level.toUpperCase()}: ${log.message}`),
            ),
            transports: [new transports.Console()],
        });
    }

    /**
     * Connect to a specific host and port for the Dolittle runtime.
     * @param {string} host The host name to connect to.
     * @param {number} port The port to connect to.
     * @returns {MigratorBuilder} The migrator builder for continuation.
     * @summary If not used, the default host of 'localhost' and port 50053 will be used.
     */
    withRuntimeOn(host: string, port: number): MigratorBuilder {
        this._clientBuilder.withRuntimeOn(host, port);
        return this;
    }

    /**
     * Set the winston logger to use in the migration.
     * @param {Logger} logger A winston logger.
     * @returns {MigratorBuilder} The migrator builder for continuation.
     * @see {@link https://github.com/winstonjs/winston|winston} for further information.
     */
    withLogging(logger: Logger): MigratorBuilder {
        this._logger = logger;
        return this;
    }

    /**
     * Use the provided artifacts to assiciate event types with class names.
     * @param {any} artifacts Artifacts to use.
     * @returns {MigratorBuilder} The migrator builder for continuation.
     */
    withArtifacts(artifacts: any): MigratorBuilder {
        if (isArtifactsMap(artifacts)) {
            this._artifactsMap = artifacts;
            return this;
        }
        throw new Error('The provided artifacts was not valid');
    }

    /**
     * Use the provided callback to modify events before committing.
     * @param {EventModifierCallback} callback Callback to use.
     * @returns {MigratorBuilder} The migrator builder for continuation.
     */
    withEventModifier(callback: EventModifierCallback): MigratorBuilder {
        this._modifierCallback = callback;
        return this;
    }

    /**
     * Configure v4 event sources.
     * @param {string} mongoConnectionString The connection string to the v4 event store MongoDB.
     * @param {SourceBuilderCallback} callback The builder callback.
     * @returns {MigratorBuilder} The migrator builder for continuation.
     */
    withSource(mongoConnectionString: string, callback: SourceBuilderCallback): MigratorBuilder {
        callback(this._sourcesBuilder.forSourceDatabase(mongoConnectionString));
        return this;
    }

    /**
     * Build the {Migrator}.
     * @returns {Migrator}
     */
    build(): Migrator {
        const aggregateVersions = new AggregateVersions();

        const converter = new EventConverter(
            this._logger,
            this._artifactsMap,
            this._modifierCallback,
        );

        const sources = this._sourcesBuilder.build(
            this._logger
        );

        this._clientBuilder.withLogging(this._logger);
        const client = this._clientBuilder.build();

        return new Migrator(
            this._logger,
            aggregateVersions,
            converter,
            client,
            sources
        );
    }
}