// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { prop } from '@typegoose/typegoose';

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

    constructor() {
        this.Major = 0;
        this.Minor = 0;
        this.Patch = 0;
        this.Build = 0;
        this.PreRelease = '';
    }
}
