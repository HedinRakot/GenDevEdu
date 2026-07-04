using DevEdu.Crm.Api.Models;

namespace DevEdu.Crm.Api.Dtos;

public record AgenturDto(
    string Kundennummer,
    string VermittlerName,
    string VermittlerEmail,
    string VermittlerPhone,
    string Dienststelle);

public record GutscheinDto(
    string Nummer,
    DateTime? GueltigBis);

public record StatusHistoryDto(
    PipelinePhase Phase,
    string? Note,
    DateTime ChangedAt);

public record ParticipantDto(
    string Id,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    DateTime? BirthDate,
    string Street,
    string PostalCode,
    string City,
    AgenturDto Agentur,
    GutscheinDto Gutschein,
    PipelinePhase Phase,
    List<StatusHistoryDto> StatusHistory,
    DateTime? CourseStart,
    string Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>Schlanke Form für Board und Tabelle.</summary>
public record ParticipantListItemDto(
    string Id,
    string FirstName,
    string LastName,
    string Email,
    PipelinePhase Phase,
    string Kundennummer,
    DateTime? CourseStart,
    DateTime UpdatedAt);

public record CreateParticipantRequest(
    string? FirstName,
    string? LastName,
    string? Email = null,
    string? Phone = null,
    DateTime? BirthDate = null,
    string? Street = null,
    string? PostalCode = null,
    string? City = null,
    AgenturDto? Agentur = null,
    GutscheinDto? Gutschein = null,
    PipelinePhase? Phase = null,
    DateTime? CourseStart = null,
    string? Notes = null);

/// <summary>Stammdaten-Update — die Phase wird bewusst nur über den Phase-Endpoint geändert.</summary>
public record UpdateParticipantRequest(
    string? FirstName,
    string? LastName,
    string? Email = null,
    string? Phone = null,
    DateTime? BirthDate = null,
    string? Street = null,
    string? PostalCode = null,
    string? City = null,
    AgenturDto? Agentur = null,
    GutscheinDto? Gutschein = null,
    DateTime? CourseStart = null,
    string? Notes = null);

public record ChangePhaseRequest(PipelinePhase Phase, string? Note = null);
