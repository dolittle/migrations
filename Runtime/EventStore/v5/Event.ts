import { Guid } from '@dolittle/rudiments';
import { ExecutionContext } from './ExecutionContext';
import { EventMetadata } from "./EventMetadata";
import { Aggregate } from "./Aggregate";
import { EventHorizon } from "./EventHorizon";

export class Event {
    _id: number;
    Partition: Guid;
    ExecutionContext: ExecutionContext;
    Metadata: EventMetadata;
    Aggregate: Aggregate;
    EventHorizon: EventHorizon;
    Content: any;
}
