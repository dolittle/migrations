// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export type Artifacts = {
    readonly [key: string]: {
        readonly generation: number;
        readonly type: string;
    }
};

export type Feature = {
    readonly commands: Artifacts;
    readonly events: Artifacts;
    readonly eventSources: Artifacts;
    readonly readModels: Artifacts;
    readonly queries: Artifacts;
};

export type ArtifactsMap = {
    readonly [key: string]: Feature;
};

function isArtifacts(obj: unknown): obj is Artifacts {
    return obj !== null && typeof obj === 'object' && Object.values(obj!).every((artifact) => {
        return artifact !== null && typeof artifact === 'object'
            && artifact!.hasOwnProperty('generation') && typeof (artifact as any).generation === 'number'
            && artifact!.hasOwnProperty('type') && typeof (artifact as any).type === 'string';
    });
}

function isFeature(obj: unknown): obj is Feature {
    return obj !== null && typeof obj === 'object'
        && obj!.hasOwnProperty('commands') && isArtifacts((obj as any).commands)
        && obj!.hasOwnProperty('events') && isArtifacts((obj as any).events)
        && obj!.hasOwnProperty('eventSources') && isArtifacts((obj as any).eventSources)
        && obj!.hasOwnProperty('readModels') && isArtifacts((obj as any).readModels)
        && obj!.hasOwnProperty('queries') && isArtifacts((obj as any).queries);
}

export function isArtifactsMap(obj: unknown): obj is ArtifactsMap {
    return obj !== null && typeof obj === 'object' && Object.values(obj!).every((feature) => {
        return isFeature(feature);
    });
}