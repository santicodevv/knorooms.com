using System.Net;
using System.Text.Json;
using Knorooms.Modules;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
namespace Knorooms.IntegrationTests.Api;

public sealed class ResendInvitationTests
{
    [Fact]
    public async Task Resend_SendsToFixedEndpoint_WithIdempotencyAndSanitizedFailure()
    {
        var handler = new CaptureHandler(); using var http = new HttpClient(handler); var type = typeof(ModulesDependencyInjection).Assembly.GetType("Knorooms.Modules.Modules.Identity.Infrastructure.ResendInvitationEmailSender")!;
        using var sender = (IDisposable)Activator.CreateInstance(type, http, Options.Create(new InvitationOptions { ResendApiKey = "test-key-not-real", FromAddress = "invitaciones@example.test" }))!;
        var service = (IInvitationEmailSender)sender; Assert.True(service.IsConfigured);
        await service.SendAsync("director@example.test", "https://school.example.test/accept-invitation#test"); var first = handler.Key;
        await service.SendAsync("director@example.test", "https://school.example.test/accept-invitation#test"); Assert.Equal(first, handler.Key); Assert.Equal("https://api.resend.com/emails", handler.Url); Assert.Equal("Bearer test-key-not-real", handler.Authorization);
        using var json = JsonDocument.Parse(handler.Body!); Assert.Equal("director@example.test", json.RootElement.GetProperty("to")[0].GetString());
        handler.Fail = true; var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.SendAsync("director@example.test", "https://school.example.test/#different")); Assert.DoesNotContain("test-key", error.Message); Assert.DoesNotContain("different", error.Message);
    }
    [Fact]
    public async Task Resend_RemainsUsableAfterAnEarlierRequestScopeIsDisposed()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["Invitations:Provider"] = "Resend",
                ["Invitations:ResendApiKey"] = "test-key-not-real",
                ["Invitations:FromAddress"] = "invitaciones@example.test"
            }).Build());
        services.AddKnoroomsModules(enableOutboxBackgroundWorker: false);
        using var provider = services.BuildServiceProvider();
        using (var requestScope = provider.CreateScope())
        {
            Assert.True(requestScope.ServiceProvider.GetRequiredService<IInvitationEmailSender>().IsConfigured);
        }

        using var workerScope = provider.CreateScope();
        var sender = workerScope.ServiceProvider.GetRequiredService<IInvitationEmailSender>();
        // Cancelar antes del envío evita cualquier conexión externa en esta regresión.
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => sender.SendAsync(
            "director@example.test", "https://school.example.test/accept-invitation#test", new CancellationToken(true)));
    }

    private sealed class CaptureHandler : HttpMessageHandler
    {
        public string? Key { get; private set; }
        public string? Url { get; private set; }
        public string? Body { get; private set; }
        public string? Authorization { get; private set; }
        public bool Fail { get; set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) { Url = request.RequestUri!.ToString(); Key = request.Headers.GetValues("Idempotency-Key").Single(); Authorization = request.Headers.Authorization!.ToString(); Body = await request.Content!.ReadAsStringAsync(cancellationToken); return new(Fail ? HttpStatusCode.BadRequest : HttpStatusCode.OK); }
    }
}
