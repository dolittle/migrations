// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { guid } from '../guid';
import { modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ options: { customName: 'EventMetadataV5' } })
export class EventMetadata {
    @prop()
    Occurred!: Date;

    @guid()
    EventSource!: Guid;

    @guid()
    TypeId!: Guid;

    @prop()
    TypeGeneration!: number;

    @prop()
    Public!: boolean;
}
