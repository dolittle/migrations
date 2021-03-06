// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { modelOptions, prop } from '@typegoose/typegoose';
import { guid } from '../guid';

@modelOptions({ options: { customName: 'EventHorizonV5' } })
export class EventHorizon {
    @prop()
    FromEventHorizon!: boolean;

    @prop()
    ExternalEventLogSequenceNumber!: number;

    @prop()
    Received!: Date;

    @guid()
    Consent!: Guid;
}
