// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export function camelize(value: string): string {
    const characters = value.trim().split('');
    characters[0] = characters[0].toLowerCase();
    return characters.join('');
}
