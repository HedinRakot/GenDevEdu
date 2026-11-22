using DevEdu.Api.Services;

namespace DevEdu.Api.Endpoints;

public static class CertificateEndpoints
{
    public static void MapCertificateEndpoints(this IEndpointRouteBuilder app)
    {
        // F10: öffentliche Zertifikat-Verifikation per Code — bewusst OHNE Auth,
        // damit Dritte (z. B. Arbeitgeber) ein Zertifikat prüfen können.
        app.MapGet("/api/certificates/{code}",
            async (string code, CertificateService svc) =>
            {
                var result = await svc.VerifyByCodeAsync(code);
                return result.Valid ? Results.Ok(result) : Results.NotFound();
            })
            .AllowAnonymous();
    }
}
