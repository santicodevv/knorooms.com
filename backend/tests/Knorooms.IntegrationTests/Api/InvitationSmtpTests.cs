using System.Net;
using System.Net.Sockets;
using System.Text;
using Knorooms.Modules;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Knorooms.IntegrationTests.Api;

public sealed class InvitationSmtpTests
{
    [Fact]
    public async Task Sender_DeliversToLocalSmtpWithoutExternalEmail()
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        var received = ReceiveAsync(listener, timeout.Token);
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddLogging();
        services.AddKnoroomsModules(enableOutboxBackgroundWorker: false);
        services.Configure<InvitationOptions>(o =>
        {
            o.Provider = "Smtp";
            o.SmtpHost = "127.0.0.1"; o.SmtpPort = port; o.SmtpEnableSsl = false;
            o.FromAddress = "knorooms@example.test";
        });
        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var sender = scope.ServiceProvider.GetRequiredService<IInvitationEmailSender>();
        Assert.True(sender.IsConfigured);
        await sender.SendAsync("director@example.test", "http://colegio.localhost:3000/accept-invitation#test", timeout.Token);
        var mail = await received;
        Assert.Contains("RCPT TO:<director@example.test>", mail, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Subject:", mail);
        var body = mail[(mail.IndexOf("\r\n\r\n", StringComparison.Ordinal) + 4)..].Trim();
        body = body.TrimEnd('.').Trim();
        if (mail.Contains("Content-Transfer-Encoding: base64", StringComparison.OrdinalIgnoreCase))
            body = Encoding.UTF8.GetString(Convert.FromBase64String(body));
        Assert.Contains("accept-invitation", body);
    }

    private static async Task<string> ReceiveAsync(TcpListener listener, CancellationToken cancellationToken)
    {
        using var client = await listener.AcceptTcpClientAsync(cancellationToken);
        await using var stream = client.GetStream();
        using var reader = new StreamReader(stream, Encoding.ASCII, leaveOpen: true);
        await using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true) { AutoFlush = true, NewLine = "\r\n" };
        await writer.WriteLineAsync("220 localhost SMTP");
        var content = new StringBuilder();
        var readingData = false;
        while (await reader.ReadLineAsync(cancellationToken) is { } line)
        {
            // SMTP usa CRLF; AppendLine depende del sistema operativo y en Linux rompe la separación de cabeceras.
            content.Append(line).Append("\r\n");
            if (readingData)
            {
                if (line == ".") { await writer.WriteLineAsync("250 Message accepted"); return content.ToString(); }
                continue;
            }
            if (line.StartsWith("DATA", StringComparison.OrdinalIgnoreCase))
            { readingData = true; await writer.WriteLineAsync("354 End with a dot"); }
            else await writer.WriteLineAsync("250 OK");
        }
        throw new InvalidOperationException("El cliente no completó el mensaje SMTP.");
    }
}
