namespace DevEdu.Crm.Api.Services.Email;

/// <summary>
/// SMTP-Konfiguration, gebunden aus "Email:Smtp:*". Zugangsdaten gehören in ein Secret
/// (User-Secrets/Env), nicht in eine eingecheckte appsettings.json.
/// </summary>
public class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 587;
    public string? User { get; set; }
    public string? Password { get; set; }

    /// <summary>Absender-Adresse.</summary>
    public string FromAddress { get; set; } = "no-reply@developer-education.com";

    /// <summary>Anzeigename des Absenders.</summary>
    public string FromName { get; set; } = "Developer Education";

    /// <summary>STARTTLS erzwingen (Standard für Port 587). Bei false: nur wenn Server es anbietet.</summary>
    public bool UseStartTls { get; set; } = true;
}
