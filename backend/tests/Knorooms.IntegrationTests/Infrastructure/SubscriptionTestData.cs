using Knorooms.Modules.Modules.Subscriptions.Contracts;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.Extensions.DependencyInjection;
namespace Knorooms.IntegrationTests.Infrastructure;

internal static class SubscriptionTestData
{
    internal static async Task EnableAsync(IServiceProvider provider, Guid institutionId)
    {
        await using var scope = provider.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
        using var platform = context.BeginScope(ExecutionScopeContext.Anonymous with { HostKind = TenantHostKind.Platform, ExecutionMode = DatabaseExecutionMode.Platform });
        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var plan = await service.CreatePlanAsync(new($"TEST-{Guid.NewGuid():N}", "Plan de pruebas", "Solo pruebas automatizadas", 1, null, null, "Custom", null, null,
            ProductModuleCatalog.All.Where(x => x.Available).Select(x => x.Code).ToArray()));
        Assert.True(plan.IsSuccess, plan.Error.Description);
        var assigned = await service.AssignAsync(institutionId, new(plan.Value.Id, DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(1), "Active", "Preparación de prueba académica", [], null));
        Assert.True(assigned.IsSuccess, assigned.Error.Description);
    }
}
