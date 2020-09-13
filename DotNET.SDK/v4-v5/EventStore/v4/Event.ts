import { Guid } from '@dolittle/rudiments';
import { ExeutionContext } from './ExeutionContext';

export class Event {
    _id: Guid;
    correlation_id: Guid;
    event_artifact: Guid;
    generation: 1;
    event_source_artifact: Guid;
    eventsource_id: Guid;
    commit: number;
    sequence: number;
    occurred: number;
    original_context: ExeutionContext;
    event: any;
}
