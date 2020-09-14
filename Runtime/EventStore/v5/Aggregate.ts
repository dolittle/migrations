import { Guid } from '@dolittle/rudiments';

export class Aggregate {
    WasAppliedByAggregate: boolean;
    TypeId: Guid;
    TypeGeneration: number;
    Version: number;
}
