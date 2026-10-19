using Knorooms.Modules.Common.Persistence;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Knorooms.Modules.Modules.Platform.Infrastructure;

/// <summary>
/// Procesador en segundo plano del Transactional Outbox.
/// Ejecuta únicamente sobre eventos de transacciones ya confirmadas y establece un contexto de ejecución explícito.
/// </summary>
internal sealed class OutboxProcessorHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxProcessorHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await ProcessPendingBatchAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error while processing Outbox batch.");
            }
        }
    }

    public async Task<int> ProcessPendingBatchAsync(CancellationToken cancellationToken = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var tenantContextAccessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        using var executionScope = tenantContextAccessor.BeginScope(new ExecutionScopeContext(
            TenantHostKind.Platform,
            TenantId: null,
            TenantSlug: null,
            TenantName: null,
            IsTenantSuspended: false,
            UserId: null,
            ExecutionMode: DatabaseExecutionMode.Platform));

        var pending = await dbContext.OutboxMessages
            .Where(m => m.ProcessedOnUtc == null && m.AttemptCount < 5)
            .OrderBy(m => m.OccurredOnUtc)
            .Take(25)
            .ToListAsync(cancellationToken);

        if (pending.Count == 0)
        {
            return 0;
        }

        var now = DateTimeOffset.UtcNow;
        foreach (var message in pending)
        {
            try
            {
                logger.LogInformation(
                    "Dispatched Outbox domain event {EventId} ({EventType}) for TenantId={TenantId}.",
                    message.Id,
                    message.EventType,
                    message.TenantId);
                message.MarkProcessed(now);
            }
            catch (Exception ex)
            {
                message.MarkFailed(ex.Message);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return pending.Count;
    }
}
