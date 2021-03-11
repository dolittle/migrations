// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Logger } from 'winston';
import { from, combineLatest } from 'rxjs';
import { concatMap, endWith, map, startWith, throttleTime } from 'rxjs/operators';

import { Guid } from '@dolittle/rudiments';
import { Client } from '@dolittle/sdk';
import { EventSourceId, AggregateRootId, IEventStore, UncommittedAggregateEvents } from '@dolittle/sdk.events';
import { MicroserviceId, TenantId, CorrelationId } from '@dolittle/sdk.execution';

import { AggregateVersions } from './AggregateVersions';
import { EventConverter } from './EventConverter';
import { MigratorBuilder } from './MigratorBuilder';
import { Source } from './Sources';
import { Commit, ExecutionContext as OriginalContext } from './v4';

/**
 * Represents the migrator for migrating events from Dolittle v4 to v5.
 */
export class Migrator {

    /**
     * Creates an instance of migrator.
     * @param {Logger} logger Winston Logger for logging.
     * @param {AggregateVersions} aggregateVersions Used to keep track of aggregate root versions while commiting.
     * @param {EventConverter} eventConverter Used to convert event content before committing.
     * @param {Client} client Client to use for committing migrated v5 events.
     * @param {Source[]} sources Sources to fetch v4 events from.
     */
    constructor(
        readonly logger: Logger,
        readonly aggregateVersions: AggregateVersions,
        readonly eventConverter: EventConverter,
        readonly client: Client,
        readonly sources: readonly Source[],
    ) {}

    /**
     * Runs the migrations for all sources.
     */
    run(): Promise<void> {
        this.logger.info('Starting migration');

        return new Promise((resolve, reject) => {
            combineLatest(this.sources.map((source) =>
                source.commits().pipe(
                    concatMap((output) => from(this.commitEventsAndReportProgress(
                        output.tenant,
                        output.commit,
                        output.eventCount,
                        output.eventIndex,
                    ))),
                    map((progress) => `${source.eventStore} ${Math.round(progress * 100)}%`),
                    startWith(`${source.eventStore} 0%`),
                    endWith(`${source.eventStore} Done!`)
                ),
            )).pipe(
                throttleTime(10000),
            ).subscribe({
                next: (progresses) => this.logger.info('Progress:\n\t' + progresses.sort().join('\n\t')),
                complete: () => resolve(),
                error: (error) => reject(error),
            });
        });
    }

    private async commitEventsAndReportProgress(tenant: TenantId, commit: Commit, eventCount: number, eventIndex: number): Promise<number> {
        const eventStore = this.client.eventStore.forTenant(tenant);
        this.overrideExecutionContext(eventStore, commit.events[0].correlation_id, commit.events[0].original_context);

        const events = this.eventConverter.convertEvents(commit.events);

        if (events.length > 0) {
            const expectedVersion = this.aggregateVersions.getExpectedVersionFor(tenant, commit.event_source_artifact, commit.eventsource_id);

            const result = await eventStore.commitForAggregate(new UncommittedAggregateEvents(
                EventSourceId.from(commit.eventsource_id),
                AggregateRootId.from(commit.event_source_artifact),
                expectedVersion,
                ...events));

            this.aggregateVersions.incrementVersionFor(tenant, commit.event_source_artifact, commit.eventsource_id, events.length);

            if (result.failed) throw new Error(result.failure?.reason.value);
        }

        return (eventIndex + commit.events.length) / eventCount;
    }

    private overrideExecutionContext(eventStore: IEventStore, correlationId: Guid, originalContext: OriginalContext): void {
        (eventStore as any)._executionContext._correlationId = CorrelationId.from(correlationId);
        (eventStore as any)._executionContext._environment = originalContext.environment;
    }

    /**
     * Create a migrator builder for a Microservice.
     * @param {MicroserviceId | Guid | string} microserviceId The unique identifier for the microservice.
     * @returns {MigratorBuilder} The builder to build a {Migrator} from.
     */
    static forMicroservice(microserviceId: MicroserviceId | Guid | string): MigratorBuilder {
        return new MigratorBuilder(Client.forMicroservice(microserviceId));
    }
}