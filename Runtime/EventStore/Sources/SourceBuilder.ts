// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { TenantId } from '@dolittle/sdk.execution';

import { SourcesBuilder } from './SourcesBuilder';

/**
 * Represents a builder for building {Source}.
 */
export class SourceBuilder {
    constructor(private readonly _sourcesBuilder: SourcesBuilder, private readonly _mongoConnectionString: string) {}

    /**
     * Add a Dolittle v4 event store to set of sources to migrate.
     * @param {string} eventStore The event store database name.
     * @param {TenantId | Guid | string} tenant The tenant id that the event store belongs to.
     */
    convert(eventStore: string, tenant: TenantId | Guid | string): void {
        this._sourcesBuilder.addSource(this._mongoConnectionString, eventStore, tenant);
    }
}
