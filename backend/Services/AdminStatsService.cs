using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

/// <summary>
/// Aggregiert Lern-, Quiz- und Anwesenheitsdaten für das Teilnehmer-Dashboard
/// im Adminbereich. Wiederverwendet <see cref="StatsCalculator"/> (pro Nutzer)
/// und die F14-Tagesaggregate; Lernzeit pro Kurs/Kapitel wird aus den
/// 60-s-Heartbeats gezählt (1 Event ≈ 1 Minute — Näherung, keine Sessionisierung).
/// </summary>
public class AdminStatsService
{
    /// <summary>Aktiv = letzte Aktivität innerhalb dieses Fensters.</summary>
    private static readonly TimeSpan ActiveWindow = TimeSpan.FromDays(7);

    private readonly MongoContext _db;

    public AdminStatsService(MongoContext db) => _db = db;

    // ─── Liste ────────────────────────────────────────────────────────────────

    public async Task<List<AdminLearnerSummaryDto>> GetLearnersAsync()
    {
        var users = await _db.Users.Find(FilterDefinition<User>.Empty).ToListAsync();
        var courses = await _db.Courses.Find(FilterDefinition<Course>.Empty).ToListAsync();

        var enrollments = Group(await _db.Enrollments.Find(FilterDefinition<Enrollment>.Empty).ToListAsync(), e => e.UserId);
        var progress = Group(await _db.Progress.Find(FilterDefinition<Progress>.Empty).ToListAsync(), p => p.UserId);
        var attempts = Group(await _db.Attempts.Find(FilterDefinition<Attempt>.Empty).ToListAsync(), a => a.UserId);
        var quizAttempts = Group(await _db.ChapterQuizAttempts.Find(FilterDefinition<ChapterQuizAttempt>.Empty).ToListAsync(), a => a.UserId);
        var codeSubs = Group(await _db.CodeSubmissions.Find(FilterDefinition<CodeSubmission>.Empty).ToListAsync(), s => s.UserId);
        var daily = Group(await _db.DailyAttendance.Find(FilterDefinition<DailyAttendance>.Empty).ToListAsync(), d => d.UserId);

        var now = DateTime.UtcNow;
        var result = new List<AdminLearnerSummaryDto>();

        foreach (var user in users)
        {
            var uid = user.ClerkUserId;
            var myEnrollments = enrollments.GetValueOrDefault(uid, new());
            var myProgress = progress.GetValueOrDefault(uid, new());
            var myAttempts = attempts.GetValueOrDefault(uid, new());
            var myDaily = daily.GetValueOrDefault(uid, new());

            var stats = StatsCalculator.Build(
                CoursesOf(courses, myEnrollments, myProgress),
                myEnrollments, myProgress, myAttempts,
                quizAttempts.GetValueOrDefault(uid, new()),
                codeSubs.GetValueOrDefault(uid, new()));

            var lastActivity = LastActivity(myDaily, myProgress, myAttempts);

            result.Add(new AdminLearnerSummaryDto(
                UserId: uid,
                DisplayName: AttendanceService.DisplayName(user, uid),
                Email: user.Email,
                Role: user.Roles.FirstOrDefault() ?? "learner",
                Active: lastActivity is not null && now - lastActivity.Value <= ActiveWindow,
                LastActivityUtc: lastActivity,
                TotalLearningMinutes: myDaily.Sum(d => d.Minutes),
                OverallProgressPercent: stats.OverallProgressPercent,
                QuizAccuracyPercent: stats.QuizAccuracyPercent,
                TotalAnswered: stats.TotalAnswered,
                ActiveCourses: stats.ActiveCourses,
                CompletedCourses: stats.CompletedCourses));
        }

        return result
            .OrderBy(r => r.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    // ─── Detail ───────────────────────────────────────────────────────────────

    public async Task<ServiceResult<AdminLearnerDetailDto>> GetLearnerDetailAsync(string userId)
    {
        var user = await _db.Users.Find(u => u.ClerkUserId == userId).FirstOrDefaultAsync();
        if (user is null)
            return ServiceResult<AdminLearnerDetailDto>.NotFound("User not found.");

        var enrollments = await _db.Enrollments.Find(e => e.UserId == userId).ToListAsync();
        var progressList = await _db.Progress.Find(p => p.UserId == userId).ToListAsync();
        var attempts = await _db.Attempts.Find(a => a.UserId == userId).ToListAsync();
        var quizAttempts = await _db.ChapterQuizAttempts.Find(a => a.UserId == userId).ToListAsync();
        var codeSubs = await _db.CodeSubmissions.Find(s => s.UserId == userId).ToListAsync();
        var daily = await _db.DailyAttendance.Find(d => d.UserId == userId).ToListAsync();
        var events = await _db.AttendanceEvents.Find(e => e.UserId == userId).ToListAsync();

        var courseIds = enrollments.Select(e => e.CourseId)
            .Concat(progressList.Select(p => p.CourseId))
            .Concat(attempts.Select(a => a.CourseId))
            .Distinct()
            .ToList();
        var courses = courseIds.Count == 0
            ? new List<Course>()
            : await _db.Courses.Find(c => courseIds.Contains(c.Id)).ToListAsync();
        var questionLists = courseIds.Count == 0
            ? new List<QuestionList>()
            : await _db.QuestionLists.Find(q => courseIds.Contains(q.CourseId)).ToListAsync();

        var stats = StatsCalculator.Build(
            CoursesOf(courses, enrollments, progressList),
            enrollments, progressList, attempts, quizAttempts, codeSubs);

        // ~Minuten je (Kurs, Kapitel) aus Heartbeat-/Login-Events (1 Event ≈ 1 min).
        var minutesByCourseChapter = events
            .Where(e => !string.IsNullOrEmpty(e.CourseId))
            .GroupBy(e => (CourseId: e.CourseId!, ChapterId: e.ChapterId ?? string.Empty))
            .ToDictionary(g => g.Key, g => g.Count());

        var courseTimes = BuildCourseTimes(courses, minutesByCourseChapter);
        var engagement = BuildEngagement(courses, progressList, minutesByCourseChapter);
        var history = BuildAttemptHistory(attempts, questionLists, courses);

        var recentCode = codeSubs
            .OrderByDescending(s => s.CreatedAt)
            .Take(50)
            .Select(s => new CodeSubmissionSummaryDto(
                s.QuestionId, s.Status.ToString(), s.Outcome.ToString(),
                s.PassedCount, s.TotalCount, s.CreatedAt))
            .ToList();

        return ServiceResult<AdminLearnerDetailDto>.Ok(new AdminLearnerDetailDto(
            UserId: userId,
            DisplayName: AttendanceService.DisplayName(user, userId),
            Email: user.Email,
            LastActivityUtc: LastActivity(daily, progressList, attempts),
            TotalLearningMinutes: daily.Sum(d => d.Minutes),
            Stats: stats,
            CourseTimes: courseTimes,
            Engagement: engagement,
            RecentAttempts: history,
            RecentCodeSubmissions: recentCode));
    }

    // ─── Bausteine ────────────────────────────────────────────────────────────

    private static List<CourseTimeDto> BuildCourseTimes(
        List<Course> courses,
        Dictionary<(string CourseId, string ChapterId), int> minutes)
    {
        var byCourse = minutes.GroupBy(kv => kv.Key.CourseId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<CourseTimeDto>();
        foreach (var (courseId, entries) in byCourse)
        {
            var course = courses.FirstOrDefault(c => c.Id == courseId);
            var chapters = entries
                .Where(kv => kv.Key.ChapterId.Length > 0)
                .Select(kv =>
                {
                    var chapter = course?.Chapters.FirstOrDefault(
                        ch => ch.Id == kv.Key.ChapterId || ch.ElementId == kv.Key.ChapterId);
                    var name = chapter is null
                        ? kv.Key.ChapterId
                        : Mappers.PrimaryText(chapter.Titel) is { Length: > 0 } t ? t : chapter.Name;
                    return new ChapterTimeDto(kv.Key.ChapterId, name, kv.Value);
                })
                .OrderByDescending(ct => ct.Minutes)
                .ToList();

            var courseName = course is null
                ? courseId
                : Mappers.PrimaryText(course.Titel) is { Length: > 0 } cn ? cn : course.Name;
            result.Add(new CourseTimeDto(courseId, courseName, entries.Sum(kv => kv.Value), chapters));
        }
        return result.OrderByDescending(ct => ct.Minutes).ToList();
    }

    private static List<ChapterEngagementDto> BuildEngagement(
        List<Course> courses,
        List<Progress> progressList,
        Dictionary<(string CourseId, string ChapterId), int> minutes)
    {
        var result = new List<ChapterEngagementDto>();
        foreach (var course in courses)
        {
            var prog = progressList.FirstOrDefault(p => p.CourseId == course.Id);
            var completedIds = (prog?.CompletedChapterContentIds ?? new()).ToHashSet();
            var passedQuizIds = (prog?.PassedChapterQuizIds ?? new()).ToHashSet();
            var completionByContent = (prog?.ContentCompletions ?? new())
                .ToDictionary(cc => cc.ContentId, cc => cc.CompletedAtUtc);

            foreach (var chapter in course.Chapters.OrderBy(ch => ch.SortOrder))
            {
                var contentIds = chapter.ChapterContent.Select(cc => cc.ElementId).ToList();
                var completed = contentIds.Count(completedIds.Contains);
                if (completed == 0 && !passedQuizIds.Contains(chapter.Id))
                    continue; // Kapitel ohne jeden Fortschritt weglassen

                var minutesTracked =
                    minutes.GetValueOrDefault((course.Id, chapter.Id)) +
                    minutes.GetValueOrDefault((course.Id, chapter.ElementId));
                var lastCompletion = contentIds
                    .Where(completionByContent.ContainsKey)
                    .Select(id => (DateTime?)completionByContent[id])
                    .DefaultIfEmpty(null)
                    .Max();

                var name = Mappers.PrimaryText(chapter.Titel) is { Length: > 0 } t ? t : chapter.Name;
                result.Add(new ChapterEngagementDto(
                    course.Id, chapter.Id, name,
                    completed, contentIds.Count,
                    passedQuizIds.Contains(chapter.Id),
                    minutesTracked, lastCompletion));
            }
        }
        return result;
    }

    private static List<AttemptHistoryDto> BuildAttemptHistory(
        List<Attempt> attempts,
        List<QuestionList> questionLists,
        List<Course> courses)
    {
        var questionById = questionLists
            .SelectMany(ql => ql.Questions)
            .GroupBy(q => q.Id)
            .ToDictionary(g => g.Key, g => g.First());

        return attempts
            .OrderByDescending(a => a.CreatedAt)
            .Take(100)
            .Select(a =>
            {
                questionById.TryGetValue(a.QuestionId, out var question);
                var answersById = question?.Answers.ToDictionary(x => x.Id, x => x)
                                  ?? new Dictionary<string, Answer>();
                var selected = a.SelectedAnswerIds
                    .Select(id => answersById.TryGetValue(id, out var ans)
                        ? Mappers.PrimaryText(ans.Titel)
                        : id)
                    .ToList();
                var course = courses.FirstOrDefault(c => c.Id == a.CourseId);

                return new AttemptHistoryDto(
                    a.QuestionId,
                    question is null ? null : Mappers.PrimaryText(question.Titel),
                    a.CourseId,
                    course is null ? null : Mappers.PrimaryText(course.Titel) is { Length: > 0 } t ? t : course.Name,
                    a.IsCorrect,
                    selected,
                    a.SubmittedText,
                    a.CreatedAt);
            })
            .ToList();
    }

    private static List<Course> CoursesOf(
        List<Course> all, List<Enrollment> enrollments, List<Progress> progress)
    {
        var ids = enrollments.Select(e => e.CourseId)
            .Concat(progress.Select(p => p.CourseId))
            .ToHashSet();
        return all.Where(c => ids.Contains(c.Id)).ToList();
    }

    private static DateTime? LastActivity(
        List<DailyAttendance> daily, List<Progress> progress, List<Attempt> attempts)
    {
        var candidates = new List<DateTime?>
        {
            daily.Count == 0 ? null : daily.Max(d => d.LastActivityUtc),
            progress.Count == 0 ? null : progress.Max(p => (DateTime?)p.LastVisited),
            attempts.Count == 0 ? null : attempts.Max(a => (DateTime?)a.CreatedAt),
        };
        return candidates.Where(c => c is not null).DefaultIfEmpty(null).Max();
    }

    private static Dictionary<string, List<T>> Group<T>(List<T> items, Func<T, string> key) =>
        items.GroupBy(key).ToDictionary(g => g.Key, g => g.ToList());
}
