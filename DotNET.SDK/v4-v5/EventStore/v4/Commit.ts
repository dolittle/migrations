import { Guid } from '@dolittle/rudiments';

export class Commit {
    _id: number;
    correlation_id: Guid;
    commit_id: Guid;
    timestamp: number;
    eventsource_id: Guid;
    event_source_artifact: Guid;
    commit: number;
    sequence: 0;
