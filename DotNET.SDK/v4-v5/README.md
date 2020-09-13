# Version 4 to 5

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

### Docker Packaging


### Program / Main

### Dependency Inversion

### Logging

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

### Event Store

### Streams

### EventHandlers instead of EventProcessors


## Runtime

In version 5, the Runtime is no longer an in-process component of your solution.
It has been separated out and you need it to be running and the SDK connecting
to it.

## Configuration

### Resources

### Event Horizon


## Guidance

### ExecutionContext


## Known issues

### Client Libraries

If you're leveraging the automatic proxy generation, we have discovered an inconsistency
in the generated proxies with what is the latest version of the client libraries.
Due to this, it is recommended that you stick with following versions:

- [Commands, 1.0.15](https://www.npmjs.com/package/@dolittle/commands/v/1.0.15)
- [Queries, 1.0.16](https://www.npmjs.com/package/@dolittle/queries/v/1.0.16)
