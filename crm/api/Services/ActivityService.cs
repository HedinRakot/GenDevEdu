using DevEdu.Crm.Api.Dtos;
using DevEdu.Crm.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Crm.Api.Services;

public class ActivityService
{
    private readonly MongoContext _db;

    public ActivityService(MongoContext db) => _db = db;

    public async Task<ServiceResult<List<ActivityDto>>> ListAsync(string participantId)
    {
        if (!await ParticipantExistsAsync(participantId))
            return ServiceResult<List<ActivityDto>>.NotFound("Teilnehmer nicht gefunden.");

        var activities = await _db.Activities.Find(a => a.ParticipantId == participantId)
            .SortByDescending(a => a.CreatedAt)
            .ToListAsync();

        return ServiceResult<List<ActivityDto>>.Ok(activities.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<ActivityDto>> CreateAsync(string participantId, CreateActivityRequest req)
    {
        if (!await ParticipantExistsAsync(participantId))
            return ServiceResult<ActivityDto>.NotFound("Teilnehmer nicht gefunden.");

        if (string.IsNullOrWhiteSpace(req.Text))
            return ServiceResult<ActivityDto>.Validation("Text ist erforderlich.");

        var kind = string.IsNullOrWhiteSpace(req.Kind) ? "note" : req.Kind.Trim().ToLowerInvariant();
        if (!ActivityEntry.AllowedKinds.Contains(kind))
            return ServiceResult<ActivityDto>.Validation(
                $"Ungültige Art '{req.Kind}'. Erlaubt: {string.Join(", ", ActivityEntry.AllowedKinds)}.");

        var activity = new ActivityEntry
        {
            ParticipantId = participantId,
            Text = req.Text.Trim(),
            Kind = kind,
        };

        await _db.Activities.InsertOneAsync(activity);
        return ServiceResult<ActivityDto>.Ok(ToDto(activity));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(string participantId, string activityId)
    {
        var result = await _db.Activities.DeleteOneAsync(
            a => a.Id == activityId && a.ParticipantId == participantId);

        return result.DeletedCount == 0
            ? ServiceResult<bool>.NotFound("Aktivität nicht gefunden.")
            : ServiceResult<bool>.Ok(true);
    }

    private async Task<bool> ParticipantExistsAsync(string participantId) =>
        await _db.Participants.CountDocumentsAsync(p => p.Id == participantId) > 0;

    private static ActivityDto ToDto(ActivityEntry a) =>
        new(a.Id, a.ParticipantId, a.Text, a.Kind, a.CreatedAt);
}
