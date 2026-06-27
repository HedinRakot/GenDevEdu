using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

// ─── Lokalisierung ────────────────────────────────────────────────────────────

public class TextItem
{
    public string Text { get; set; } = string.Empty;
    /// <summary>0 = Russian, 1 = German, 2 = English</summary>
    public int Language { get; set; }
}

public class Texte
{
    public List<TextItem> Items { get; set; } = new();
}

// ─── Enums ───────────────────────────────────────────────────────────────────

public enum ChapterContentType { Lesson = 0, Video = 1, Questions = 2 }

// ─── ChapterContent ──────────────────────────────────────────────────────────

public class ChapterContent
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ElementId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public string ChapterId { get; set; } = string.Empty;
    public Texte Titel { get; set; } = new();
    public ChapterContentType ContentType { get; set; } = ChapterContentType.Lesson;
    public string LessonText { get; set; } = string.Empty;
    public Texte LessonTexte { get; set; } = new();
    public string VideoUrl { get; set; } = string.Empty;
    /// <summary>ID des QuestionList-Dokuments (leer wenn kein Quiz).</summary>
    public string QuestionListId { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public double AverageRank { get; set; }
    public int MaxRank { get; set; }
}

// ─── Chapter ─────────────────────────────────────────────────────────────────

public class Chapter
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ElementId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public Texte Titel { get; set; } = new();
    public int SortOrder { get; set; }
    public bool Show { get; set; } = true;
    public List<ChapterContent> ChapterContent { get; set; } = new();

    // ─── F8: Kapitel-Abschlussquiz ───────────────────────────────────────────
    /// <summary>ID der QuestionList des Kapitel-Abschlussquiz (null = kein Quiz).</summary>
    public string? ChapterQuizId { get; set; }
    /// <summary>Bestehensgrenze in Prozent (0–100).</summary>
    public int PassThresholdPercent { get; set; } = 60;
    /// <summary>Maximale Versuche (0 = unbegrenzt).</summary>
    public int MaxAttempts { get; set; }
}

// ─── Course ──────────────────────────────────────────────────────────────────

public class Course
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string ElementId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Texte Titel { get; set; } = new();
    public string AuthorId { get; set; } = string.Empty;
    public string Status { get; set; } = CourseStatus.Draft;
    public List<Chapter> Chapters { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public static class CourseStatus
{
    public const string Draft = "Draft";
    public const string Published = "Published";
    public const string Archived = "Archived";
}
