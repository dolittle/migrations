// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ options: { customName: 'VersionV5' } })
export class Version {
    @prop()
    Major!: number;

    @prop()
    Minor!: number;

    @prop()
    Patch!: number;

    @prop()
    Build!: number;

    @prop()
    PreRelease!: string;
}
