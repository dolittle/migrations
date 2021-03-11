// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Binary } from 'mongodb';

import { Guid } from '@dolittle/rudiments';

export function guidFromBinary(data: Binary): Guid {
    return new Guid(data.buffer);
}
