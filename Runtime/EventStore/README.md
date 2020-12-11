# EventStore Migrator

[![npm version](https://badge.fury.io/js/%40dolittle%2Feventstore-migrator.svg)](https://badge.fury.io/js/%40dolittle%2Feventstore-migrator)

## Getting started

**This guide will assume TypeScript and using Yarn - it is not a requirement**

Start by creating a folder for your migrator.

Then initialize the package.

```shell
$ npm init
```

Since this guide is based on TypeScript, we want to add that as a developer dependency, and we're leveraging 'ts-node' for
easy running.

```shell
$ yarn add -D typescript ts-node
```

```json
{
    "compilerOptions": {
        "target": "es2015",
        "module": "CommonJS",
        "moduleResolution": "node",
        "allowSyntheticDefaultImports": true,
        "rootDir": ".",
        "baseUrl": "./",
        "sourceRoot": "./",
        "outDir": "dist"
    },
    "include": [
        "**/*.ts"
    ],
    "exclude": [
        "node_modules"
    ],
    "references": []
}
```

In your `package.json` file, you can now add the following to your `scripts` key:

```json
{
    "scripts": {
        "start": "ts-node index.ts"
    }
}
```

The next thing we need is the Dolittle base migrator. It is built leveraging [Mongoose](https://www.npmjs.com/package/mongoose).
You will provide the connection(s) for it to migrate, so for the TypeScript transpiler to be happy - we should also add
the typings for it.

```shell
$ yarn add @dolittle/eventstore-migrator
$ yarn add -D @types/mongoose
```

### Creating a basic migrator

Add a file called `index.ts`.

We then need to import the following:

```typescript
import mongoose from 'mongoose';
import { EventStoreConverter } from '@dolittle/eventstore-migrator'
import { logger } from '@dolittle/eventstore-migrator';
```

The logger is optional, but can prove handy for outputting information during the run of the migrator.

```typescript
(async () => {
    const sourceServer = 'mongodb://localhost:27018';
    const destinationServer = 'mongodb://localhost:27017';

    const sourceConnection = await mongoose.createConnection(sourceServer, {
        useNewUrlParser: true,
        dbName: 'eventstore',
        useFindAndModify: false
    });

    const destinationConnection = await mongoose.createConnection(destinationServer, {
        useNewUrlParser: true,
        dbName: 'eventstore',
        useFindAndModify: false
    });

    logger.info('Starting to convert');

    const converter = new EventStoreConverter(sourceConnection, destinationConnection, logger);
    await converter.convert();

    logger.info('Done converting');
})();
```

Notice the connection strings at the top and `dbName` properties for the connections.
If you have multiple event stores to migrate, for instance for multiple tenants, you can quite easily create
a loop doing this for all.

If you don't need any custom transformations, you can now just run it from your terminal:

```shell
$ yarn start
```

### Transforming events during migration

The converter supports a callback mechanism that gets called on every event that is migrated.
This enables you to do transformations and also choose whether or not you want the event to be included by
returning `true` from the callback for including or `false` for not including an event.

Version 4 of the Dolittle event store implementation serialized some types in a way that would not
be compatible with version 5 and deserializing back to the client code. One of these is `DateTime` or `DateTimeOffset`.
In v4, these types ended up as a number; Unix EPOCH. While in v5, it will assume it is an actual ISO date with time.

Another aspect of transformation is to correct any wrong events that could potentially not replay nicely
and worst case not get you back to the state you wanted.

```typescript
import mongoose from 'mongoose';
import { EventStoreConverter } from '@dolittle/eventstore-migrator'
import { logger } from '@dolittle/eventstore-migrator';

(async () => {
    const sourceServer = 'mongodb://localhost:27018';
    const destinationServer = 'mongodb://localhost:27017';

    const sourceConnection = await mongoose.createConnection(sourceServer, {
        useNewUrlParser: true,
        dbName: 'eventstore',
        useFindAndModify: false
    });

    const destinationConnection = await mongoose.createConnection(destinationServer, {
        useNewUrlParser: true,
        dbName: 'eventstore',
        useFindAndModify: false
    });

    logger.info('Starting to convert');

    const converter = new EventStoreConverter(sourceConnection, destinationConnection, logger, (source, destination) => {

        // Transform anything on the event
        // Source has a property called event, which is the object literal for your source event
        // Destination has a property called Content, which is the object literal for your destination event

        // Return true to include the event
        return true;
    });
    await converter.convert();

    logger.info('Done converting');
})();
```

#### Event Type

You might want to do certain operations for certain event types. From the generated `artifacts.json` file you get
when using the .NET SDK with the build tool, we can create a simple resolver that enables us to work with event types
by their name, rather than their unique identifier. The `artifacts.json` file can be required directly in your code
and you can build maps from it.

```typescript
const artifacts = require('../Core/.dolittle/artifacts.json');
const typesForArtifact: any = {};

for (const featureName in artifacts) {
    const feature = artifacts[featureName];

    for (const artifactId in feature.events) {
        const artifact = feature.events[artifactId];
        typesForArtifact[artifact.type] = artifactId;
    }
}
```

Imagining you have events and properties you want to correct - for instance all events with a date on it:

```typescript
const eventsAndPropertiesWithDate: any = {
    'MyEvent': ['SomeDateProperty'],
    'MyOtherEvent': ['SomeDateProperty', 'SomeOtherDateProperty']
};
```

We can then create some convenient lookup maps for this:

```typescript
const typeKeys = Object.keys(typesForArtifact);
const eventTypeAndPropertiesWithDate: any = {};
const artifactToEventName: any = {};
const eventNameToArtifact: any = {};

for (const eventName in eventsAndPropertiesWithDate) {
    const type = typeKeys.find(t => t.indexOf(`.${eventName}`) >= 0);
    if (type) {
        const artifact = typesForArtifact[type];
        artifactToEventName[artifact] = eventName;
        eventNameToArtifact[eventName] = artifact;
        eventTypeAndPropertiesWithDate[artifact] = eventsAndPropertiesWithDate[eventName];
    } else {
        logger.warn(`No type for ${eventName}`);
    }
}
```

#### Handling DateTime

With the event type map we can now simply loop through properties for the event types we want to modify:

```typescript
const converter = new EventStoreConverter(sourceConnection, destinationConnection, logger, (source, destination) => {
    const artifact = source.event_artifact.toString();

    if (eventTypeAndPropertiesWithDate[artifact]) {
        for (const property of eventTypeAndPropertiesWithDate[artifact]) {

            let value = source.event[property];

            if (value === Infinity) {
                value = new Date(1970, 1, 1).valueOf();
            }

            value = new Date(value);
            if (value.valueOf() === Infinity) {
                value = new Date(1970, 1, 1).valueOf();
            }
            destination.Content[property.toCamelCase()] = value.toUTCString();
        }
    }

    return true;
});
await converter.convert();
```

**PS: The `toCamelCase()` method comes from the `@dolittle/eventstore-migrator` package and is an extension to the `String` prototype.**
