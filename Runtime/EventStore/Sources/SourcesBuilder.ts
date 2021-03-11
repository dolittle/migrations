// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Logger } from 'winston';

import { Guid } from '@dolittle/rudiments';
import { TenantId } from '@dolittle/sdk.execution';

import { Source } from './Source';
import { SourceBuilder } from './SourceBuilder';

type InternalSource = {
    readonly mongoConnectionString: string;
    readonly eventStore: string;
    readonly tenant: TenantId;
};

/**
 * Represents a builder for building {Source}.
 */
export class SourcesBuilder {
    private readonly _sources: InternalSource[] = [];

    /**
     * Create a {SourceBuilder} for building {Source}.
     * @param {string} mongoConnectionString The Dolittle v4 event store MongoDB connection string.
     */
    forSourceDatabase(mongoConnectionString: string): SourceBuilder {
        return new SourceBuilder(this, mongoConnectionString);
    }

    /**
     * Add a Dolittle v4 event store to set of sources to migrate.
     * @param {string} mongoConnectionString The Dolittle v4 event store MongoDB connection string.
     * @param {string} eventStore The event store database name.
     * @param {TenantId | Guid | string} tenant The tenant id that the event store belongs to.
     */
    addSource(mongoConnectionString: string, eventStore: string, tenant: TenantId | Guid | string): void {
        this._sources.push({ mongoConnectionString, eventStore, tenant: TenantId.from(tenant) });
    }

    /**
     * Build list of {Source} to migrate.
     * @param {Logger} logger Winston Logger for logging.
     * @returns {Source[]} Sources to migrate.
     */
    build(logger: Logger): readonly Source[] {
        return this._sources.map((source) => new Source(
            logger,
            source.mongoConnectionString,
            source.eventStore,
            source.tenant));
    }
}