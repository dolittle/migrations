// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Binary } from 'mongodb';
import { Logger } from 'winston';

import { Generation } from '@dolittle/sdk.artifacts';
import { EventType, EventTypeId, UncommittedAggregateEvent } from '@dolittle/sdk.events';

import { ArtifactsMap } from './Artifacts';
import { camelize } from './camelize';
import { Event } from './v4/Event';
import { guidFromBinary } from './v4/guidFromBinary';

export type EventModifierCallback = (converted: any, eventType: EventType, className: string | undefined, logger: Logger) => boolean;

export class EventConverter {
    constructor(
        private readonly logger: Logger,
        private readonly artifactsMap: ArtifactsMap,
        private readonly callback: EventModifierCallback
    ) {}

    convertEvents(events: readonly Event[]): UncommittedAggregateEvent[] {
        const result: UncommittedAggregateEvent[] = [];
        for (const event of events) {
            const [include, converted] = this.convertEvent(event);
            if (include) result.push(converted);
        }
        return result;
    }

    private convertEvent(event: Event): [boolean, UncommittedAggregateEvent] {
        const eventType = new EventType(EventTypeId.from(event.event_artifact), Generation.from(event.generation));
        const [include, content] = this.convertContent(event.event, eventType);
        return [include, { eventType, content, public: false }];
    }

    private convertContent(event: any, eventType: EventType): [boolean, any] {
        const converted = this.performUniversalModifications(event);
        const className = this.findEventTypeClassName(eventType);
        const include = this.callback(converted, eventType, className, this.logger);
        return [include, converted];
    }

    private performUniversalModifications(value: any): any {
        if (value instanceof Binary) {
            switch (value.sub_type) {
                case 2:
                case 3:
                    return guidFromBinary(value).toString();
                default:
                    return value.toString();
            }
        }

        if (Array.isArray(value)) {
            return value.map(_ => this.performUniversalModifications(_));
        }

        if (typeof value === 'object') {
            const result: any = {};
            for (const property in value) {
                result[camelize(property)] = this.performUniversalModifications(value[property]);
            }
            return result;
        }

        return value;
    }

    private findEventTypeClassName(eventType: EventType): string | undefined {
        for (const feature of Object.values(this.artifactsMap)) {
            for (const [eventTypeId, artifact] of Object.entries(feature.events)) {
                if (eventTypeId === eventType.id.toString()) {
                    return artifact.type.split(',')[0];
                }
            }
        }

        return undefined;
    }
}