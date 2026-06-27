using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

public enum MobileQuestionType { OneChoice = 0, MultipleChoice = 1, OwnAnswer = 2, TrueFalse = 3, Code = 4 }

public class Answer
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public bool IsCorrect { get; set; }
    public Texte Titel { get; set; } = new();
    public string Comment { get; set; } = string.Empty;
}

public class Question
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ElementId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Texte Titel { get; set; } = new();
    public MobileQuestionType QuestionType { get; set; } = MobileQuestionType.OneChoice;
    public List<Answer> Answers { get; set; } = new();
    public string AnswerValue { get; set; } = string.Empty;

    /// <summary>Nur bei <see cref="MobileQuestionType.Code"/> gesetzt, sonst null.</summary>
    public CodeQuestion? Code { get; set; }
}

/// <summary>Eigene MongoDB-Collection "questionlists". Fragen werden lazy geladen.</summary>
public class QuestionList
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string ElementId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public string ChapterContentId { get; set; } = string.Empty;
    /// <summary>Bei Kapitel-Abschlussquizzen gesetzt (dann ist ChapterContentId leer).</summary>
    public string ChapterId { get; set; } = string.Empty;
    public List<Question> Questions { get; set; } = new();
}
