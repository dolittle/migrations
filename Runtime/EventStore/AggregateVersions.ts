// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { AggregateRootVersion } from '@dolittle/sdk.events';
import { TenantId } from '@dolittle/sdk.execution';


type VersionsBySource = Map<string, number>;
type SourcesByAggregate = Map<string, VersionsBySource>;
type AggregatesByTenant = Map<string, SourcesByAggregate>;

/**
 * Represents a system that keeps track of aggregate root versions during migration.
 */
export class AggregateVersions {
    private readonly _aggregatesByTenant: AggregatesByTenant = new Map();

    /**
     * Gets the expected version for an aggregate root
     * @param {TenantId} tenant The tenant id.
     * @param {Guid} aggregateRoot The aggregate root id.
     * @param {Guid} eventSource The event source id.
     */
    getExpectedVersionFor(tenant: TenantId, aggregateRoot: Guid, eventSource: Guid): AggregateRootVersion {
        const tenantId = tenant.toString(), aggregateRootId = aggregateRoot.toString(), eventSourceId = eventSource.toString();

        let sourcesByAggregate: SourcesByAggregate;
        if (this._aggregatesByTenant.has(tenantId)) {
            sourcesByAggregate = this._aggregatesByTenant.get(tenantId)!;
        } else {
            sourcesByAggregate = new Map();
            this._aggregatesByTenant.set(tenantId, sourcesByAggregate);
        }

        let versionsBySource: VersionsBySource;
        if (sourcesByAggregate.has(aggregateRootId)) {
            versionsBySource = sourcesByAggregate.get(aggregateRootId)!;
        } else {
            versionsBySource = new Map();
            sourcesByAggregate.set(aggregateRootId, versionsBySource);
        }

        let version = 0;
        if (versionsBySource.has(eventSourceId)) {
            version = versionsBySource.get(eventSourceId)!;
        } else {
            versionsBySource.set(eventSourceId, version);
        }

        return AggregateRootVersion.from(version);
    }

    /**
     * Increments version for an aggregate root
     * @param {TenantId} tenant The tenant id.
     * @param {Guid} aggregateRoot The aggregate root id.
     * @param {Guid} eventSource The event source id.
     */
    incrementVersionFor(tenant: TenantId, aggregateRoot: Guid, eventSource: Guid, eventCount: number): AggregateRootVersion {
        const tenantId = tenant.toString(), aggregateRootId = aggregateRoot.toString(), eventSourceId = eventSource.toString();

        const previousVersion = this._aggregatesByTenant.get(tenantId)!.get(aggregateRootId)!.get(eventSourceId)!;
        const nextVersion = previousVersion + eventCount;
        this._aggregatesByTenant.get(tenantId)!.get(aggregateRootId)!.set(eventSourceId, nextVersion);

        return AggregateRootVersion.from(nextVersion);
    }
}