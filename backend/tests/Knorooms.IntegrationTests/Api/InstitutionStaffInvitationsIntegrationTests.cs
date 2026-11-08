using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using Knorooms.Api.Contracts;
using Knorooms.Api.Controllers;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Knorooms.IntegrationTests.Api;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class InstitutionStaffInvitationsIntegrationTests(
    PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task StaffInvitations_Create_List_DetectDuplicates_Revoke_AndAccept()
    {
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);

        var sender = new LocalSender();

        await using var app = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.Configure<InvitationOptions>(options =>
                {
                    options.SigningKey =
                        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
                    options.BaseDomain = "localhost:3000";
                    options.Scheme = "http";
                });

                services.RemoveAll<IInvitationEmailSender>();
                services.AddSingleton<IInvitationEmailSender>(sender);
            }));

        using var client = app.CreateClient();

        var suffix = Guid.NewGuid().ToString("N")[..8];
        var email = $"operator-{suffix}@example.test";

        var institutionCommand = new ProvisionInstitutionCommand(
            $"Colegio {suffix}",
            $"staff-{suffix}",
            "contact@example.test",
            "Contacto",
            "8095550100",
            "Santo Domingo",
            "",
            "America/Santo_Domingo",
            ["students"]);

        var created = await Send(
            HttpMethod.Post,
            "/api/platform/institution-management",
            institutionCommand);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var institution =
            (await created.Content.ReadFromJsonAsync<InstitutionDto>())!;

        var assigned = await Send(
            HttpMethod.Post,
            $"/api/platform/institutions/{institution.Id}/administrators",
            new AssignInstitutionAdministratorRequest(email));

        Assert.Equal(HttpStatusCode.Created, assigned.StatusCode);

        var tenantHost = $"{institution.Slug}.localhost:3000";

        var rolesResponse = await Send(
            HttpMethod.Get,
            "/api/tenant/roles",
            host: tenantHost);

        Assert.Equal(HttpStatusCode.OK, rolesResponse.StatusCode);

        var roles =
            (await rolesResponse.Content.ReadFromJsonAsync<IReadOnlyList<RoleDto>>())!;

        var teacher = Assert.Single(roles, role => role.Code == "Teacher");

        // Crear invitación.
        var recipient = $"teacher-{suffix}@example.test";

        var createResponse = await Send(
            HttpMethod.Post,
            "/api/tenant/staff-invitations",
            new CreateInstitutionStaffInvitationCommand(
                recipient,
                [teacher.Id]),
            tenantHost);

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var invitation =
            (await createResponse.Content.ReadFromJsonAsync<InstitutionStaffInvitationDto>())!;

        Assert.Equal(institution.Id, invitation.TenantId);
        Assert.Equal(recipient, invitation.Email);
        Assert.Contains(teacher.Id, invitation.RoleIds);
        Assert.Null(invitation.AcceptedAtUtc);
        Assert.Null(invitation.RevokedAtUtc);

        var responseBody = await createResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("token", responseBody, StringComparison.OrdinalIgnoreCase);

        // Listar invitaciones.
        var listResponse = await Send(
            HttpMethod.Get,
            "/api/tenant/staff-invitations",
            host: tenantHost);

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var invitations =
            (await listResponse.Content.ReadFromJsonAsync<
                IReadOnlyList<InstitutionStaffInvitationDto>>())!;

        var listedInvitation = Assert.Single(invitations);

        Assert.Equal(invitation.Id, listedInvitation.Id);
        Assert.Contains(teacher.Id, listedInvitation.RoleIds);

        // Detectar invitaciones duplicadas.
        var duplicateResponse = await Send(
            HttpMethod.Post,
            "/api/tenant/staff-invitations",
            new CreateInstitutionStaffInvitationCommand(
                recipient,
                [teacher.Id]),
            tenantHost);

        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);

        // Revocar invitación.
        var revokeResponse = await Send(
            HttpMethod.Post,
            $"/api/tenant/staff-invitations/{invitation.Id}/revoke",
            host: tenantHost);

        Assert.Equal(HttpStatusCode.NoContent, revokeResponse.StatusCode);

        var finalListResponse = await Send(
            HttpMethod.Get,
            "/api/tenant/staff-invitations",
            host: tenantHost);

        Assert.Equal(HttpStatusCode.OK, finalListResponse.StatusCode);

        var finalInvitations =
            (await finalListResponse.Content.ReadFromJsonAsync<
                IReadOnlyList<InstitutionStaffInvitationDto>>())!;

        var revokedInvitation = Assert.Single(finalInvitations);

        Assert.Equal(invitation.Id, revokedInvitation.Id);
        Assert.NotNull(revokedInvitation.RevokedAtUtc);

        // Crear otra invitación para comprobar su aceptación.
        var acceptanceRecipient = $"accept-{suffix}@example.test";

        var acceptanceResponse = await Send(
            HttpMethod.Post,
            "/api/tenant/staff-invitations",
            new CreateInstitutionStaffInvitationCommand(
                acceptanceRecipient,
                [teacher.Id]),
            tenantHost);

        Assert.Equal(HttpStatusCode.Created, acceptanceResponse.StatusCode);

        var acceptanceInvitation =
            (await acceptanceResponse.Content.ReadFromJsonAsync<
                InstitutionStaffInvitationDto>())!;

        // Entregar la invitación mediante el servicio.
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var service = scope.ServiceProvider
                .GetRequiredService<IInstitutionStaffInvitationService>();

            await service.DeliverAsync(new InstitutionStaffInvitationQueued(
                Guid.NewGuid(),
                DateTimeOffset.UtcNow,
                institution.Id,
                acceptanceInvitation.Id,
                institution.Slug));
        }

        // Recuperar el token del enlace capturado por el sender de prueba.
        var deliveredUrl = Assert.IsType<string>(sender.LastUrl);

        var token = new Uri(deliveredUrl).Fragment
            .Split("token=", StringSplitOptions.RemoveEmptyEntries)[1];

        var acceptCommand = new AcceptInstitutionStaffInvitationCommand(
            acceptanceInvitation.Id,
            token,
            "Profesor piloto",
            "LocalPilotPassword123!");

        // Aceptar sin autenticación previa.
        var accepted = await Send(
            HttpMethod.Post,
            "/api/invitations/staff/accept",
            acceptCommand,
            tenantHost,
            authenticated: false);

        Assert.Equal(HttpStatusCode.NoContent, accepted.StatusCode);

        // Confirmar que se cre� la membres�a y se asign� el rol.
        var membersResponse = await Send(
            HttpMethod.Get,
            "/api/tenant/members",
            host: tenantHost);

        Assert.Equal(HttpStatusCode.OK, membersResponse.StatusCode);

        var members =
            (await membersResponse.Content.ReadFromJsonAsync<
                IReadOnlyList<MemberDto>>())!;

        var acceptedMember = Assert.Single(
            members,
            member => string.Equals(
                member.Email,
                acceptanceRecipient,
                StringComparison.OrdinalIgnoreCase));

        Assert.Equal("Profesor piloto", acceptedMember.DisplayName);
        Assert.Equal("Active", acceptedMember.Status);
        Assert.Contains(teacher.Code, acceptedMember.Roles);

        // La misma invitación no puede aceptarse dos veces.
        var acceptedAgain = await Send(
            HttpMethod.Post,
            "/api/invitations/staff/accept",
            acceptCommand,
            tenantHost,
            authenticated: false);

        Assert.Equal(HttpStatusCode.Conflict, acceptedAgain.StatusCode);

        Task<HttpResponseMessage> Send(
            HttpMethod method,
            string path,
            object? data = null,
            string host = "admin.localhost:3000",
            bool authenticated = true)
        {
            var request = new HttpRequestMessage(method, path);

            request.Headers.Add("X-Forwarded-Host", host);

            if (authenticated)
            {
                request.Headers.Add(
                    TestOidcAuthHandler.SubjectHeader,
                    $"operator-{suffix}");

                request.Headers.Add(
                    TestOidcAuthHandler.EmailHeader,
                    email);

                request.Headers.Add(
                    TestOidcAuthHandler.RolesHeader,
                    "PlatformAdmin");

                request.Headers.Add(
                    TestOidcAuthHandler.MfaHeader,
                    "mfa");
            }

            if (data is not null)
            {
                request.Content = JsonContent.Create(data);
            }

            return client.SendAsync(request);
        }
    }

    private sealed class LocalSender : IInvitationEmailSender
    {
        public bool IsConfigured => true;

        public string? LastUrl { get; private set; }

        public Task SendAsync(
            string email,
            string acceptanceUrl,
            CancellationToken cancellationToken = default)
        {
            LastUrl = acceptanceUrl;
            return Task.CompletedTask;
        }
    }
}
