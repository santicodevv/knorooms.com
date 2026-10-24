using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.Extensions.Options;
namespace Knorooms.Modules.Modules.Identity.Infrastructure;

internal sealed class ResendInvitationEmailSender(HttpClient http, IOptions<InvitationOptions> options) : IInvitationEmailSender, IDisposable
{
    public void Dispose() => http.Dispose();
    public bool IsConfigured => !string.IsNullOrWhiteSpace(options.Value.ResendApiKey) && MailAddress.TryCreate(options.Value.FromAddress, out _);
    public async Task SendAsync(string email, string acceptanceUrl, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured) throw new InvalidOperationException("Resend no está configurado.");
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.Value.ResendApiKey);
        request.Headers.Add("Idempotency-Key", "invitation-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(acceptanceUrl))));
        request.Content = JsonContent.Create(new
        {
            from = options.Value.FromAddress,
            to = new[] { email },
            subject = "Active su acceso a KNOROOMS",
            text = "Ha recibido una invitación para administrar su colegio. Abra el enlace para establecer su contraseña o confirmar la actual si ya tiene cuenta. El enlace vence en 48 horas y es de un solo uso.\n\n" + acceptanceUrl
        });
        using var response = await http.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException("No se pudo entregar la invitación mediante Resend.");
    }
}
