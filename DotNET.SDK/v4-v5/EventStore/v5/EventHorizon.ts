import { Guid } from '@dolittle/rudiments';

export class EventHorizon {
    FromEventHorizon: boolean;
    ExternalEventLogSequenceNumber: number;
    Received: Date;
    Consent: Guid;
}
