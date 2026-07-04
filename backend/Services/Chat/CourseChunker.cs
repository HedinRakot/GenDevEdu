using DevEdu.Api.Models;

namespace DevEdu.Api.Services.Chat;

/// <summary>Eine indexierbare Passage eines Kurses (Lektion oder Frage).</summary>
public record CoursePassage(
    string Kind, string ChapterId, string SourceId, int ChunkIndex, string Title, string Text);

/// <summary>
/// Zerlegt einen Kurs in RAG-Passagen (reine Logik, kein DB-Zugriff): je Lektion
/// wird der Text in ~800-Zeichen-Chunks entlang Absätzen gepackt; je Frage entsteht
/// eine Passage aus der Fragestellung. Deutsch (Language 1) bevorzugt.
/// </summary>
public static class CourseChunker
{
    private const int TargetChunkChars = 800;

    public static IReadOnlyList<CoursePassage> Chunk(Course course, IReadOnlyList<QuestionList> questionLists)
    {
        var passages = new List<CoursePassage>();

        foreach (var chapter in course.Chapters)
        {
            foreach (var content in chapter.ChapterContent)
            {
                var body = Mappers.PrimaryText(content.LessonTexte);
                if (string.IsNullOrWhiteSpace(body)) body = content.LessonText;
                if (string.IsNullOrWhiteSpace(body)) continue;

                var title = Mappers.PrimaryText(content.Titel);
                var chunks = SplitIntoChunks(body, TargetChunkChars);
                for (var i = 0; i < chunks.Count; i++)
                    passages.Add(new CoursePassage("lesson", chapter.Id, content.Id, i, title, chunks[i]));
            }
        }

        foreach (var ql in questionLists)
        {
            foreach (var q in ql.Questions)
            {
                var prompt = Mappers.PrimaryText(q.Titel);
                if (string.IsNullOrWhiteSpace(prompt)) continue;
                passages.Add(new CoursePassage("question", ql.ChapterId, q.Id, 0, prompt, prompt));
            }
        }

        return passages;
    }

    /// <summary>Packt Absätze (Leerzeile-getrennt) greedy in Chunks ~maxChars.</summary>
    internal static List<string> SplitIntoChunks(string text, int maxChars)
    {
        var paragraphs = text
            .Replace("\r\n", "\n")
            .Split("\n\n", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var chunks = new List<string>();
        var current = new System.Text.StringBuilder();

        void Flush()
        {
            if (current.Length > 0) { chunks.Add(current.ToString().Trim()); current.Clear(); }
        }

        foreach (var para in paragraphs)
        {
            if (current.Length > 0 && current.Length + para.Length + 2 > maxChars) Flush();

            if (para.Length > maxChars)
            {
                // Sehr langer Absatz: hart in maxChars-Stücke schneiden.
                Flush();
                for (var i = 0; i < para.Length; i += maxChars)
                    chunks.Add(para.Substring(i, Math.Min(maxChars, para.Length - i)).Trim());
                continue;
            }

            if (current.Length > 0) current.Append("\n\n");
            current.Append(para);
        }
        Flush();

        return chunks.Count > 0 ? chunks : new List<string> { text.Trim() };
    }
}
