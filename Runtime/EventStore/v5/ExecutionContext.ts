import { Guid } from '@dolittle/rudiments';
import { Claim } from './Claim';
import { Version } from './Version';

export class ExecutionContext {
    Correlation!: Guid;
    Microservice!: Guid;
    Tenant!: Guid;
    Version!: Version;
    Environment!: string;
    CLaims!: Claim[];
}
