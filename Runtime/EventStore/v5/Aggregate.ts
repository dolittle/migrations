// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { prop } from '@typegoose/typegoose';
import { guid } from '../guid';

export class Aggregate {
    @prop()
    WasAppliedByAggregate!: boolean;

    @guid()
    TypeId!: Guid;

    @prop()
    TypeGeneration!: number;

    @prop()
    Version!: number;
}
