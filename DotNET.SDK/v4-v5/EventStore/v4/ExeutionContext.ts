import { Guid } from '@dolittle/rudiments';
import { Claim } from './Claim';

export class ExeutionContext {
    application: Guid;
    bounded_context: Guid;
    tenant: Guid;
    environment: string;
    claims: Claim[];
}
