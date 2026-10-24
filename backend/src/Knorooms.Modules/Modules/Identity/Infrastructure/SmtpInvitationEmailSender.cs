using System.Net;
using System.Net.Mail;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.Extensions.Options;

namespace Knorooms.Modules.Modules.Identity.Infrastructure;

internal sealed class SmtpInvitationEmailSender(IOptions<InvitationOptions> options) : IInvitationEmailSender
{
    public bool IsConfigured => !string.IsNullOrWhiteSpace(options.Value.SmtpHost)
        && MailAddress.TryCreate(options.Value.FromAddress, out _);
    public async Task SendAsync(string email, string acceptanceUrl, CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
        {
            EnableSsl = settings.SmtpEnableSsl,
            Timeout = 15000,
            Credentials = string.IsNullOrWhiteSpace(settings.SmtpUsername) ? null :
                new NetworkCredential(settings.SmtpUsername, settings.SmtpPassword)
        };
        using var mail = new MailMessage(settings.FromAddress, email)
        {
            Subject = "Invitación para administrar su colegio en KNOROOMS",
            Body = "Ha recibido una invitación para administrar su colegio. Tiene una vigencia de 48 horas y solo puede aceptarse una vez.\n\n"
                + acceptanceUrl + "\n\nSi ya tiene una cuenta, confirme su contraseña actual. Si no esperaba esta invitación, puede ignorarla."
        };
        await client.SendMailAsync(mail, cancellationToken);
    }
}
