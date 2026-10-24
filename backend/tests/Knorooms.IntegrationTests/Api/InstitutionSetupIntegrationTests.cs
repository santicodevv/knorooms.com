using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Knorooms.Api.Contracts;
using Knorooms.Api.Controllers;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Knorooms.IntegrationTests.Api;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class InstitutionSetupIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    private const string Password = "LocalPilotPassword123!";
    [Fact]
    public async Task Setup_Invitations_Acceptance_And_Rls_AreIsolatedAndSingleUse()
    {
        var sender = new CaptureSender();
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        await using var app = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.Configure<InvitationOptions>(o =>
            {
                o.SigningKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
                o.BaseDomain = "localhost:3000"; o.Scheme = "http";
            });
            services.RemoveAll<IInvitationEmailSender>();
            services.AddSingleton<IInvitationEmailSender>(sender);
        }));
        using var client = app.CreateClient();
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var a = await Create($"setup-a-{suffix}");
        var b = await Create($"setup-b-{suffix}");
        var email = $"director-{suffix}@example.test";
        var setup = await GetSetup(a);
        Assert.Equal(0, setup.ProgressPercent);
        var profile = new UpdateInstitutionProfileCommand("Colegio actualizado", "Dirección", email, "8095550100",
            "Santo Domingo", "TEST", "", "America/Santo_Domingo", "Equipo KNOROOMS", true, "Reunión realizada", setup.Profile.Version);
        Assert.Equal(HttpStatusCode.OK, (await Send(HttpMethod.Put, $"/api/platform/institutions/{a.Id}/profile", profile)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(HttpMethod.Put, $"/api/platform/institutions/{a.Id}/profile", profile)).StatusCode);
        Assert.Equal(75, (await GetSetup(a)).ProgressPercent);
        Assert.Equal(b.Name, (await GetSetup(b)).Profile.Name);

        var invited = await Invite(a, email);
        var invitationPath = $"/api/platform/institutions/{a.Id}/invitations";
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(HttpMethod.Post, invitationPath,
            new InviteAdministratorRequest("outsider@example.test"), $"{a.Slug}.localhost:3000", admin: false)).StatusCode);
        var command = await DeliveredCommand(invited.Id, a);
        Assert.Equal(HttpStatusCode.BadRequest, (await Accept(command, b)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Accept(command, a)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Accept(command, a)).StatusCode);
        var finished = await GetSetup(a);
        Assert.Equal(100, finished.ProgressPercent);
        Assert.Single(finished.Administrators);
        Assert.Equal("Accepted", finished.Invitations.Single(x => x.Id == invited.Id).Status);

        var existingInvitation = await Invite(b, email);
        var existingCommand = await DeliveredCommand(existingInvitation.Id, b);
        Assert.Equal(HttpStatusCode.BadRequest, (await Accept(existingCommand with { Password = "WrongPassword" }, b)).StatusCode);
        Assert.Empty((await GetSetup(b)).Administrators);
        Assert.Equal(HttpStatusCode.NoContent, (await Accept(existingCommand, b)).StatusCode);

        var revoked = await Invite(a, $"revoked-{suffix}@example.test");
        var revokedCommand = await DeliveredCommand(revoked.Id, a);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(HttpMethod.Post,
            $"/api/platform/institutions/{b.Id}/invitations/{revoked.Id}/revoke")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Send(HttpMethod.Post,
            $"/api/platform/institutions/{a.Id}/invitations/{revoked.Id}/revoke")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Accept(revokedCommand, a)).StatusCode);

        var expired = await Invite(a, $"expired-{suffix}@example.test");
        var expiredCommand = await DeliveredCommand(expired.Id, a);
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var accessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            using var tenant = accessor.BeginScope(Context(a));
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.AdministratorInvitations.Where(x => x.Id == expired.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.ExpiresAtUtc, DateTimeOffset.UtcNow.AddMinutes(-1)));
            Assert.All(await db.AdministratorInvitations.IgnoreQueryFilters().ToListAsync(), x => Assert.Equal(a.Id, x.TenantId));
            using (accessor.BeginScope(Context(a) with { TenantId = null, ExecutionMode = DatabaseExecutionMode.Platform }))
                Assert.Empty(await db.AdministratorInvitations.IgnoreQueryFilters().ToListAsync());
            // El rol real knorooms_app tampoco puede insertar una invitación de otro colegio mediante SQL.
            var exception = await Assert.ThrowsAsync<Npgsql.PostgresException>(() => db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE administrator_invitations SET tenant_id = {b.Id} WHERE id = {expired.Id}"));
            Assert.Equal("42501", exception.SqlState);
        }
        Assert.Equal(HttpStatusCode.BadRequest, (await Accept(expiredCommand, a)).StatusCode);

        var concurrent = await Invite(a, $"concurrent-{suffix}@example.test");
        var concurrentCommand = await DeliveredCommand(concurrent.Id, a);
        var responses = await Task.WhenAll(Accept(concurrentCommand, a), Accept(concurrentCommand, a));
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.NoContent);
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.BadRequest);

        async Task<InstitutionDto> Create(string slug)
        {
            var response = await Send(HttpMethod.Post, "/api/platform/institutions", new CreateInstitutionRequest(slug, "Colegio piloto"));
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            return (await response.Content.ReadFromJsonAsync<InstitutionDto>())!;
        }
        async Task<InstitutionSetupDto> GetSetup(InstitutionDto institution)
        {
            var response = await Send(HttpMethod.Get, $"/api/platform/institutions/{institution.Id}/setup");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            return (await response.Content.ReadFromJsonAsync<InstitutionSetupDto>())!;
        }
        async Task<AdministratorInvitationDto> Invite(InstitutionDto institution, string recipient)
        {
            var response = await Send(HttpMethod.Post, $"/api/platform/institutions/{institution.Id}/invitations", new InviteAdministratorRequest(recipient));
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var body = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain("token", body, StringComparison.OrdinalIgnoreCase);
            return JsonSerializer.Deserialize<AdministratorInvitationDto>(body, JsonSerializerOptions.Web)!;
        }
        async Task<AcceptAdministratorInvitationCommand> DeliveredCommand(Guid id, InstitutionDto institution)
        {
            await using var scope = app.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var message = await db.OutboxMessages.AsNoTracking().Where(x => x.EventType == typeof(AdministratorInvitationQueued).FullName)
                .ToListAsync();
            var payload = message.Select(x => JsonSerializer.Deserialize<AdministratorInvitationQueued>(x.PayloadJson)!)
                .Single(x => x.InvitationId == id);
            Assert.DoesNotContain("Token", JsonSerializer.Serialize(payload));
            await scope.ServiceProvider.GetRequiredService<IAdministratorInvitationService>().DeliverAsync(payload);
            var url = new Uri(sender.LastUrl!);
            Assert.Equal($"{institution.Slug}.localhost", url.Host);
            var token = url.Fragment.Split("token=")[1];
            return new AcceptAdministratorInvitationCommand(id, token, "Director piloto", Password);
        }
        Task<HttpResponseMessage> Accept(AcceptAdministratorInvitationCommand command, InstitutionDto institution) =>
            Send(HttpMethod.Post, "/api/invitations/accept", command, $"{institution.Slug}.localhost:3000", false);
        Task<HttpResponseMessage> Send(HttpMethod method, string path, object? body = null,
            string host = "admin.localhost:3000", bool admin = true)
        {
            var request = new HttpRequestMessage(method, path);
            request.Headers.Add("X-Forwarded-Host", host);
            if (admin)
            {
                request.Headers.Add(TestOidcAuthHandler.SubjectHeader, $"operator-{suffix}");
                request.Headers.Add(TestOidcAuthHandler.EmailHeader, $"operator-{suffix}@example.test");
                request.Headers.Add(TestOidcAuthHandler.RolesHeader, "PlatformAdmin");
                request.Headers.Add(TestOidcAuthHandler.MfaHeader, "mfa");
            }
            else if (path.StartsWith("/api/platform", StringComparison.Ordinal))
            {
                request.Headers.Add(TestOidcAuthHandler.SubjectHeader, $"outsider-{suffix}");
                request.Headers.Add(TestOidcAuthHandler.EmailHeader, $"outsider-{suffix}@example.test");
            }
            if (body is not null) request.Content = JsonContent.Create(body);
            return client.SendAsync(request);
        }
    }
    private static ExecutionScopeContext Context(InstitutionDto institution) => new(TenantHostKind.Institution,
        institution.Id, institution.Slug, institution.Name, false, null, DatabaseExecutionMode.Tenant);

    private sealed class CaptureSender : IInvitationEmailSender
    {
        public bool IsConfigured => true;
        public string? LastUrl { get; private set; }
        public Task SendAsync(string email, string acceptanceUrl, CancellationToken cancellationToken = default)
        { LastUrl = acceptanceUrl; return Task.CompletedTask; }
    }
}
