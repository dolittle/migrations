
declare interface String {
    toCamelCase(): string;
}

String.prototype.toCamelCase = function () {
    return this
        .replace(/\s(.)/g, function ($1: string) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function ($1: string) { return $1.toLowerCase(); });
}