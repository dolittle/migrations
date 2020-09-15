// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ options: { customName: 'ClaimV5' } })
export class Claim {
    @prop()
    Name!: string;

    @prop()
    Value!: string;

    @prop()
    ValueType!: string;
}
