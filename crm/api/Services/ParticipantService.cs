using System.Text.RegularExpressions;
using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DevEdu.Crm.Api.Services;

public class ParticipantService
{
    private readonly MongoContext _db;

    public ParticipantService(MongoContext db) => _db = db;

    public async Task<ServiceResult<List<ParticipantListItemDto>>> ListAsync(string? phase, string? search)
    {
        var filter = Builders<Participant>.Filter.Empty;

        if (!string.IsNullOrWhiteSpace(phase))
        {
            if (!Enum.TryParse<PipelinePhase>(phase, ignoreCase: true, out var parsed))
                return ServiceResult<List<ParticipantListItemDto>>.Validation($"Unbekannte Phase '{phase}'.");
            filter &= Builders<Participant>.Filter.Eq(p => p.Phase, parsed);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var regex = new BsonRegularExpression(Regex.Escape(search.Trim()), "i");
            filter &= Builders<Participant>.Filter.Or(
                Builders<Participant>.Filter.Regex(p => p.FirstName, regex),
                Builders<Participant>.Filter.Regex(p => p.LastName, regex),
                Builders<Participant>.Filter.Regex(p => p.Agentur.Kundennummer, regex));
        }

        var participants = await _db.Participants.Find(filter)
            .SortBy(p => p.LastName).ThenBy(p => p.FirstName)
            .ToListAsync();

        return ServiceResult<List<ParticipantListItemDto>>.Ok(participants.Select(ToListItem).ToList());
    }

    public async Task<ServiceResult<ParticipantDto>> GetAsync(string id)
    {
        var participant = await _db.Participants.Find(p => p.Id == id).FirstOrDefaultAsync();
        return participant is null
            ? ServiceResult<ParticipantDto>.NotFound("Teilnehmer nicht gefunden.")
            : ServiceResult<ParticipantDto>.Ok(ToDto(participant));
    }

    public async Task<ServiceResult<ParticipantDto>> CreateAsync(CreateParticipantRequest req)
    {
        var errors = ValidateNames(req.FirstName, req.LastName);
        if (errors.Count > 0)
            return ServiceResult<ParticipantDto>.Validation("Validierungsfehler.", errors);

        var initialPhase = req.Phase ?? PipelinePhase.Erstgespraech;
        var participant = new Participant
        {
            FirstName = req.FirstName!.Trim(),
            LastName = req.LastName!.Trim(),
            Email = req.Email?.Trim() ?? string.Empty,
            Phone = req.Phone?.Trim() ?? string.Empty,
            BirthDate = req.BirthDate,
            Street = req.Street?.Trim() ?? string.Empty,
            PostalCode = req.PostalCode?.Trim() ?? string.Empty,
            City = req.City?.Trim() ?? string.Empty,
            Agentur = ToAgentur(req.Agentur),
            Gutschein = ToGutschein(req.Gutschein),
            Phase = initialPhase,
            StatusHistory = { new StatusHistoryEntry { Phase = initialPhase, Note = "Teilnehmer angelegt" } },
            CourseStart = req.CourseStart,
            Notes = req.Notes ?? string.Empty,
        };

        await _db.Participants.InsertOneAsync(participant);
        return ServiceResult<ParticipantDto>.Ok(ToDto(participant));
    }

    public async Task<ServiceResult<ParticipantDto>> UpdateAsync(string id, UpdateParticipantRequest req)
    {
        var errors = ValidateNames(req.FirstName, req.LastName);
        if (errors.Count > 0)
            return ServiceResult<ParticipantDto>.Validation("Validierungsfehler.", errors);

        var update = Builders<Participant>.Update
            .Set(p => p.FirstName, req.FirstName!.Trim())
            .Set(p => p.LastName, req.LastName!.Trim())
            .Set(p => p.Email, req.Email?.Trim() ?? string.Empty)
            .Set(p => p.Phone, req.Phone?.Trim() ?? string.Empty)
            .Set(p => p.BirthDate, req.BirthDate)
            .Set(p => p.Street, req.Street?.Trim() ?? string.Empty)
            .Set(p => p.PostalCode, req.PostalCode?.Trim() ?? string.Empty)
            .Set(p => p.City, req.City?.Trim() ?? string.Empty)
            .Set(p => p.Agentur, ToAgentur(req.Agentur))
            .Set(p => p.Gutschein, ToGutschein(req.Gutschein))
            .Set(p => p.CourseStart, req.CourseStart)
            .Set(p => p.Notes, req.Notes ?? string.Empty)
            .Set(p => p.UpdatedAt, DateTime.UtcNow);

        var updated = await _db.Participants.FindOneAndUpdateAsync(
            p => p.Id == id, update,
            new FindOneAndUpdateOptions<Participant> { ReturnDocument = ReturnDocument.After });

        return updated is null
            ? ServiceResult<ParticipantDto>.NotFound("Teilnehmer nicht gefunden.")
            : ServiceResult<ParticipantDto>.Ok(ToDto(updated));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(string id)
    {
        var result = await _db.Participants.DeleteOneAsync(p => p.Id == id);
        if (result.DeletedCount == 0)
            return ServiceResult<bool>.NotFound("Teilnehmer nicht gefunden.");

        // Aktivitäten des Teilnehmers mitlöschen (keine verwaisten Log-Einträge).
        await _db.Activities.DeleteManyAsync(a => a.ParticipantId == id);
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<ParticipantDto>> ChangePhaseAsync(string id, ChangePhaseRequest req)
    {
        var participant = await _db.Participants.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (participant is null)
            return ServiceResult<ParticipantDto>.NotFound("Teilnehmer nicht gefunden.");

        if (participant.Phase == req.Phase)
            return ServiceResult<ParticipantDto>.Validation("Teilnehmer ist bereits in dieser Phase.");

        var entry = new StatusHistoryEntry
        {
            Phase = req.Phase,
            Note = string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim(),
        };

        var update = Builders<Participant>.Update
            .Set(p => p.Phase, req.Phase)
            .Push(p => p.StatusHistory, entry)
            .Set(p => p.UpdatedAt, DateTime.UtcNow);

        var updated = await _db.Participants.FindOneAndUpdateAsync(
            p => p.Id == id, update,
            new FindOneAndUpdateOptions<Participant> { ReturnDocument = ReturnDocument.After });

        return updated is null
            ? ServiceResult<ParticipantDto>.NotFound("Teilnehmer nicht gefunden.")
            : ServiceResult<ParticipantDto>.Ok(ToDto(updated));
    }

    public async Task<ServiceResult<DashboardDto>> GetDashboardAsync()
    {
        var grouped = await _db.Participants.Aggregate()
            .Group(p => p.Phase, g => new { Phase = g.Key, Count = g.Count() })
            .ToListAsync();

        var byPhase = grouped.ToDictionary(g => g.Phase, g => g.Count);
        var phases = Enum.GetValues<PipelinePhase>()
            .Select(phase => new PhaseCountDto(phase, byPhase.GetValueOrDefault(phase)))
            .ToList();

        return ServiceResult<DashboardDto>.Ok(new DashboardDto(phases.Sum(p => p.Count), phases));
    }

    private static List<string> ValidateNames(string? firstName, string? lastName)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(firstName)) errors.Add("Vorname ist erforderlich.");
        if (string.IsNullOrWhiteSpace(lastName)) errors.Add("Nachname ist erforderlich.");
        return errors;
    }

    private static AgenturInfo ToAgentur(AgenturDto? dto) => new()
    {
        Kundennummer = dto?.Kundennummer?.Trim() ?? string.Empty,
        VermittlerName = dto?.VermittlerName?.Trim() ?? string.Empty,
        VermittlerEmail = dto?.VermittlerEmail?.Trim() ?? string.Empty,
        VermittlerPhone = dto?.VermittlerPhone?.Trim() ?? string.Empty,
        Dienststelle = dto?.Dienststelle?.Trim() ?? string.Empty,
    };

    private static BildungsgutscheinInfo ToGutschein(GutscheinDto? dto) => new()
    {
        Nummer = dto?.Nummer?.Trim() ?? string.Empty,
        GueltigBis = dto?.GueltigBis,
    };

    internal static ParticipantDto ToDto(Participant p) => new(
        p.Id, p.FirstName, p.LastName, p.Email, p.Phone, p.BirthDate,
        p.Street, p.PostalCode, p.City,
        new AgenturDto(p.Agentur.Kundennummer, p.Agentur.VermittlerName, p.Agentur.VermittlerEmail,
            p.Agentur.VermittlerPhone, p.Agentur.Dienststelle),
        new GutscheinDto(p.Gutschein.Nummer, p.Gutschein.GueltigBis),
        p.Phase,
        p.StatusHistory.Select(h => new StatusHistoryDto(h.Phase, h.Note, h.ChangedAt)).ToList(),
        p.CourseStart, p.Notes, p.CreatedAt, p.UpdatedAt);

    private static ParticipantListItemDto ToListItem(Participant p) => new(
        p.Id, p.FirstName, p.LastName, p.Email, p.Phase,
        p.Agentur.Kundennummer, p.CourseStart, p.UpdatedAt);
}
