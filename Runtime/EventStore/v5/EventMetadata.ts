import { Guid } from '@dolittle/rudiments';

export class EventMetadata {
    Occurred: Date;
    EventSource: Guid;
    TypeId: Guid;
    TypeGeneration: number;
    Public: boolean;
    EventLogSequenceNumber: number;
}
