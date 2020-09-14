# Version 4 to 5

## Intro

We are committed to backwards compatibility and strive towards not having breaking
changes in our APIs. With version 5 this is also true, but we've made some underlying
architectural changes that has caused some breaking changes.

The biggest change with version 5 is that you no longer compile all the capabilities
into your application. There is a `Runtime` component in the form of a [Docker image](https://hub.docker.com/r/dolittle/runtime)
that needs to be running. The SDK is then connecting to this using [gRPC](https://grpc.io).
Since all calls that involves the `Runtime` component having to work is now out-of-process
and inherently asynchronous in nature, there are things that would've "just worked" before
that does not work in the same way anymore. This is usually related to things like web requests
carrying the payload of a command, once entering an AggregateRoot, the events and processing
of these is handed over to the runtime and it will call back to your code. This means that
the async context in .NET is different and things you might have relied on to be there, might
not be there. 

The implication of this is typically that you need to add more to your events so that your
event handler has access to it. From an event design perspective, this is more accurate and
is considered best practice - as it will help you guarantee idempotency within your solution.
Having to rely on transient data from a runtime context or in-memory state will not make it
possible to replay events if needing. And this is a capability that is very powerful with
version 5 and with its stream thinking, you could find yourself creating new streams for
different purposes and then not have access to all the information you need to leverage the
stream capabilities.

## Versions

If your solution consists of multiple different projects, you might want to
consider having a common `props` file for the properties and versions of dependencies
that are common. This can then be [imported](https://docs.microsoft.com/en-us/visualstudio/msbuild/import-element-msbuild?view=vs-2019) into your projects.
The benefit of this is that you maintain the versions in one place.

An example of this could be to add a `versions.props` file to the root of your solution
and add something like the following:

```xml
<Project>
    <PropertyGroup>
        <DolittleFundamentalsVersion>5.0.0</DolittleFundamentalsVersion>
        <DolittleAspNetCoreVersion>8.0.0</DolittleAspNetCoreVersion>
        <DolittleSDKVersion>5.0.0</DolittleSDKVersion>
        <DolittleReadModelsMongoDBVersion>5.0.0</DolittleReadModelsMongoDBVersion>
        <DolittleMachineSpecificationsVersion>3.0.13</DolittleMachineSpecificationsVersion>
        <MicrosoftExtensionsVersion>3.1.2</MicrosoftExtensionsVersion>
        <SystemServiceModelVersion>4.7.*</SystemServiceModelVersion>
        <MicrosoftAspNetCoreVersion>3.1.2</MicrosoftAspNetCoreVersion>
    </PropertyGroup>
</Project>
```

You can find this file [here](./versions.props).

## .NET Core and ASP.NET Core

Everything in version 5 has been updated to using either [netstandard2.1](https://devblogs.microsoft.com/dotnet/announcing-net-standard-2-1/) and for ASP.NET Core; [netcoreapp3.1](https://docs.microsoft.com/en-us/aspnet/core/migration/30-to-31?view=aspnetcore-3.1&tabs=visual-studio).

### Program / Main

The booting procedure for Dolittle has changed a lot and is much more in
alignment with how .NET Core and the host builder works.
Typically with a .NET Core App 3.1 setup, you will have a `Program.cs`
that looks like the following:

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
    }
    
    static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            // Add this for Dolittle
            .UseDolittle()
            .ConfigureWebHostDefaults(webHostBuilder =>
            {
                webHostBuilder
                    .UseKestrel()
                    .UseContentRoot(Directory.GetCurrentDirectory())
                    .UseStartup<Startup>();
            });
}
```

### IoC Container

Since the configuration of Dolittle happens so early. The setup for the IoC container
is simplified. Firstly, the IoC is automatically discovered as before - and
out of the box, Dolittle only supports Autofac. You can however write your own implementation
of any IoC by implementing the interface `ICanProvideContainer`. An example of this
would be to look at the [Autofac implementation](https://github.com/dolittle/DotNET.Fundamentals/blob/master/Source/DependencyInversion.Autofac/ContainerProvider.cs).

With version 4 you had to have a line that configured Dolittle in the `ConfigureContainer`
method in your `Startup` class. This is no longer needed.
You can instead use the `ConfigureContainer` method to add addtional explicit bindings if you'd
like.

### Logging

With version 5, the internal logging mechanism has changed to be more aligned with the
.NET Core infrastructure for this and also honor the configuration and loglevels set.
It is recommended to configure logging as soon as possible, before you call `UseDolittle()`
in `Program`.

Below is an example using [Serilog](https://serilog.net).

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", true, true)
            .AddJsonFile($"appsettings.{environmentName}.json", true, true)
            .AddEnvironmentVariables();
        var configuration = builder.Build();

        var loggerConfiguration = new LoggerConfiguration()
            .Enrich.FromLogContext()
            .Enrich.WithExceptionDetails()
            .WriteTo.Console();

        Log.Logger = loggerConfiguration.CreateLogger();
        
        CreateHostBuilder(args).Build().Run();
    }
    
    static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            // Add this for Serilog 
            .UseSerilog(Log.Logger)
            .UseDolittle()
            .ConfigureWebHostDefaults(webHostBuilder =>
            {
                webHostBuilder
                    .UseKestrel()
                    .UseContentRoot(Directory.GetCurrentDirectory())
                    .UseStartup<Startup>();
            });
}
```

### Docker Packaging

If you're building your solution using Docker, you should update the base images used
for your build context and your runtime context.
We recommend using the following:

- Build Context: mcr.microsoft.com/dotnet/core/sdk:3.1
- Runtime Context: mcr.microsoft.com/dotnet/core/aspnet:3.1

## Tenancy

In version 4 we had the concept of a tenancy resolver that could be implemented for
controlling how to resolve the tenant identifier in the current context.
This has been removed, and we it is recommended to either use the built-in middleware
for ASP.NET Core that we provide or build your own.

If you want to use the built-in one, put the following line of code within the
`Configure` method in `Startup.cs` - preferable as soon as possible, to make sure
all requests are included for setting the Dolittle Execution Context correctly:

```csharp
app.UseDolittleExecutionContext();
``` 

If you want to provide your own mechanism for setting the correct tenant, for instance
based on claims. You could quite easily implement this: 

```csharp
public class ExecutionContextMiddleware
{
    RequestDelegate _next;
    IExecutionContextManager _executionContextManager;

    public ExecutionContextMiddleware(
            RequestDelegate next,
            IExecutionContextManager executionContextManager)
    {
        _next = next;
        _executionContextManager = executionContextManager;
    }
    
    public Task InvokeAsync(HttpContext context)
    {
        var claim = httpContext.User.Claims.First(c => c.Name == "tid"); // looking for a claim name of 'tid';
        if( claim ) 
        {
            var tenantId = Guid.Parse(claim.Value);
            var claims = new Claims(context.User.Claims.Select(c => new Claim(c.Type, c.Value, c.ValueType)));
            _executionContextManager.CurrentFor(tenantId, CorrelationId.new(), claims);
        }
        
        return _next.Invoke(context);
    }
}
``` 

## API Changes

### Namespaces

All namespaces that used to have `Dolittle.Runtime` in it is now only `Dolittle`.

### Aggregates

If you're migrating from version 3, you'll notice that the interface `IAggregateRootRepositoryFor<>`
is gone. This is replaced with `IAggregateOf<>` and has a new API for working with aggregates.
The first thing you'll notice is the formalization of the difference of creating a new object and
the continuation of an aggregate.

After you've done either a create or a rehydrate of the object, you can perform actions on
the aggregate. The API gives you back an object that contains the method `Perform()` that takes
an `Action` that allows you to declaratively tell which method to call with the parameters coming
typically from the command and passed into it.

#### Create

Creating a new instance is done in the following manner.

```csharp
public class MyCommandHandler : ICanHandleCommands
{
    IAggregateOf<MyAggregate>   _myAggregate;
    
    public MyCommandHandler(IAggregateOf<MyAggregate> myAggregate)
    {
        _myAggregate = myAggregate;
    }
    
    public void Handle(DoStuff command)
    {
        _myAggregate
            .Create(command.Id.value)
            .Perform(_ => _.DoStuff(command.SomeInput));
    }
}
```


#### Rehydrate

Rehydrating and perform additional tasks on an instance is done in the following manner.

```csharp
public class MyCommandHandler : ICanHandleCommands
{
    IAggregateOf<MyAggregate>   _myAggregate;
    
    public MyCommandHandler(IAggregateOf<MyAggregate> myAggregate)
    {
        _myAggregate = myAggregate;
    }
    
    public void Handle(DoMoreStuff command)
    {
        _myAggregate
            .Rehydrage(command.Id.value)
            .Perform(_ => _.DoMoreStuff(command.SomeInput));
    }
}
```


## Events

Its with events the biggest changes are.
The entire handling of events, storing them and then how they are distributed
to other microservices through the Event Horizon that was first introduced as
a concept in version 3.

### Event Store

The Event Store is built from the ground up and sits as the first step in the
pipeline when committing an event. The event is then stored in the event log.
Asynchronously from this, whenever events appear in the event log - filters are
running with these. If a filter for the event going through decides it is
interested in the event - the event is automatically appended to a stream identified
by the filters unique identifier.

### Streams

Streams are front and center for everything events within the runtime.
As mentioned earlier, filters decide whether or not an event should be in a stream.
A stream is an immutable definition of what events are in it - with an append only
behavior. This means a filter can't change its definition if there are existing events
that will be included by the new filter definition. This is what we mean by append only.
New events that has not appeared in the event log after the definition changed will
be accepted.

### EventHandlers instead of EventProcessors

In version 4 and prior, there was the concept of an event processor.
It was built around two pieces; implementing the interface `ICanProcessEvents` and by 
convention one or more `Process()` methods taking the event as an argument and adorning
it with the attribute `[EventProcessor()]`.

You'd have something like this:

```csharp
public class MyEventProcessor : ICanProcessevents
{
    [EventProcessor("<guid>")
    public void Process(MyEvent @event)
    {
        // Process....
    }
}
```

With this, we looked at each individual method as a unique event processor and lacked
partitioning - which lead to problems with guaranteeing ordering and correct replay
of events.

In version 5 this has been completely taken out and replaced with something called
EventHandlers. EventHandlers are in fact a specialized type of filter that filters
based on the types the implementing class can handle. This filter definition is what
is used to define the stream.

```csharp
[EventHandler("<guid>")]
public class MyEventHandler : ICanHandleEvents
{
}
```


## Runtime

In version 5, the Runtime is no longer an in-process component of your solution.
It has been separated out and you need it to be running and the SDK connecting
to it.

## Configuration

### Resources

### Event Horizon


## Guidance

### Events, replay and idempotency

The concept of [idempotency](https://en.wikipedia.org/wiki/Idempotence) is important
when working with event driven systems. It speaks about the ability of applying the
same operations multiple times and getting the same result. This means that capturing
the properties you need on the events to be able to guarantee this is important.
Any transient state that sits in-memory or is part of an execution context in any way,
is not something that should be relied on.

Since events can be replayed this becomes very important, especially with the way we do
streams and the processing of events from these. Whenever you add a new event handler
that handles events already there, they will copied to the stream of this new event handler
and played for the handle methods. This is a completely asynchronous out of context
action and it is therefor vital that information is on the events.

Another benefit of making this explicit is that you get well formed events that tell a story.

### ExecutionContext


## Known issues

### Client Libraries

If you're leveraging the automatic proxy generation, we have discovered an inconsistency
in the generated proxies with what is the latest version of the client libraries.
Due to this, it is recommended that you stick with following versions:

- [Commands, 1.0.15](https://www.npmjs.com/package/@dolittle/commands/v/1.0.15)
- [Queries, 1.0.16](https://www.npmjs.com/package/@dolittle/queries/v/1.0.16)
