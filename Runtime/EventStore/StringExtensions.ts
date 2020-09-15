// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

declare interface String {
    toCamelCase(): string;
}

String.prototype.toCamelCase = function () {
    return this
        .replace(/\s(.)/g, function ($1: string) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function ($1: string) { return $1.toLowerCase(); });
};