namespace DevEdu.Api.Dtos;

// F14: Enums reisen bewusst als camelCase-Strings (das Backend hat keinen
// globalen JsonStringEnumConverter — Zahlen wären fragil gegenüber Umsortierung).
// Event-Typen: "login" | "logout" | "heartbeat"
// Status:      "anwesend" | "teilweise" | "fehlend" | "entschuldigt" | "keinSolltag"
// Gründe:      "krank" | "urlaub" | "feiertag" | "sonstig"

public record AttendanceEventDto(
    string? ClientEventId,
    string? Type,
    DateTime OccurredAt,
    string? CourseId = null,
    string? ChapterId = null,
    string? Screen = null,
    string? Platform = null);

public record PostEventsRequest(List<AttendanceEventDto>? Events);

public record PostEventsResponse(int Accepted, int Duplicates, int Rejected);

public record DailyAttendanceDto(
    DateOnly Date,
    int Minutes,
    int RequiredMinutes,
    string Status,
    DateTime? FirstActivityUtc,
    DateTime? LastActivityUtc,
    int SessionCount,
    string? ExcuseReason,
    string? ExcuseNote);

public record LearnerDayOverviewDto(
    string UserId,
    string DisplayName,
    string Email,
    string Status,
    int Minutes,
    int RequiredMinutes,
    DateTime? FirstActivityUtc,
    DateTime? LastActivityUtc,
    string? ExcuseReason);

public record LearnerRangeOverviewDto(
    string UserId,
    string DisplayName,
    string Email,
    int TargetDays,
    int PresentDays,
    int PartialDays,
    int ExcusedDays,
    int AbsentDays,
    int TotalMinutes,
    DateOnly? LastActiveDate);

public record AttendanceSessionDto(
    DateTime StartUtc,
    DateTime EndUtc,
    int Minutes,
    string? CourseId,
    string? Screen);

public record CreateExcuseRequest(
    string? UserId,
    DateOnly? From,
    DateOnly? To,
    string? Reason,
    string? Note = null);

public record ExcuseDto(
    string Id,
    string UserId,
    DateOnly Date,
    string Reason,
    string? Note,
    string CreatedBy,
    DateTime CreatedAt);

public record TrainingPeriodDto(
    string Id,
    string UserId,
    DateOnly StartDate,
    DateOnly EndDate,
    int RequiredMinutesPerDay,
    string? Label);

public record UpsertTrainingPeriodRequest(
    string? UserId,
    DateOnly? StartDate,
    DateOnly? EndDate,
    int? RequiredMinutesPerDay,
    string? Label = null);

public record RecomputeResponse(int DaysRecomputed);
