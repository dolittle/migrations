// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Collection, Db, MongoClient } from 'mongodb';
import { Observable, Subscriber } from 'rxjs';
import { Logger } from 'winston';

import { TenantId } from '@dolittle/sdk.execution';
import { Commit } from '../v4';

export type CommitWithTenantAndIndexes = {
    readonly commit: Commit;
    readonly tenant: TenantId;
    readonly commitCount: number;
    readonly commitIndex: number;
    readonly eventCount: number;
    readonly eventIndex: number;
};

/**
 * Represents a Dolittle v4 event store source.
 */
export class Source {
    constructor(
        private readonly _logger: Logger,
        private readonly _mongoConnectionString: string,
        private readonly _eventStore: string,
        private readonly _tenant: TenantId,
    ) {}

    /**
     * @returns {Observable<CommitWithTenantAndIndexes>} All commits in the source, with progress indexes.
     */
    commits(): Observable<CommitWithTenantAndIndexes> {
        return new Observable((subscriber) => {
            this.sendAllCommitsToSubscriber(subscriber);
        });
    }

    /**
     * Gets the event store name for the source.
     */
    get eventStore(): string {
        return this._eventStore;
    }

    private async sendAllCommitsToSubscriber(subscriber: Subscriber<CommitWithTenantAndIndexes>): Promise<void> {
        try {
            const client = await this.connect();

            try {
                const commitsCollection = client.db(this._eventStore).collection('commits');
                const [commitCount, eventCount] = await this.getNumberOfCommitsAndEvents(commitsCollection);

                const cursor = commitsCollection.find({}).sort('_id', 1);

                let commitIndex = 0, eventIndex = 0;
                while (!subscriber.closed) {
                    const raw = await cursor.next();
                    if (raw === null) break;

                    const commit = new Commit(raw);
                    subscriber.next({ commit, tenant: this._tenant, commitCount, commitIndex, eventCount, eventIndex });

                    commitIndex += 1;
                    eventIndex += commit.events.length;
                }

                if (!subscriber.closed) {
                    subscriber.complete();
                }
            } catch (error) {
                subscriber.error(error);
            }

            client.close();
        } catch (error) {
            subscriber.error(error);
        }
    }

    private connect(): Promise<MongoClient> {
        this._logger.debug(`Connecting to ${this._mongoConnectionString}/${this._eventStore}`);
        return MongoClient.connect(this._mongoConnectionString, { directConnection: true, useUnifiedTopology: true });
    }

    private async getNumberOfCommitsAndEvents(commits: Collection<any>): Promise<[number, number]> {
        let numberOfCommits = 0, numberOfEvents = 0;

        await commits.aggregate([
            { $project: { events: { $size: '$events' }}},
            { $group: { _id: 0, commits: { $sum: 1 }, events: { $sum: '$events' } }},
        ]).forEach((aggragate) => {
            numberOfCommits = aggragate.commits;
            numberOfEvents = aggragate.events;
        });

        return [numberOfCommits, numberOfEvents];
    }
}