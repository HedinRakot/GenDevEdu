namespace DevEdu.Api.Models;

public static class Roles
{
    public const string Learner = "Learner";
    public const string Author = "Author";
    public const string Admin = "Admin";

    public static readonly string[] All = { Learner, Author, Admin };
}

public static class Policies
{
    public const string AuthorOrAdmin = "AuthorOrAdmin";
}

public static class CourseStatus
{
    public const string Draft = "Draft";
    public const string Published = "Published";
    public const string Archived = "Archived";
}

public static class QuestionScope
{
    public const string Topic = "Topic";
    public const string Chapter = "Chapter";
}

public static class QuestionType
{
    public const string SingleChoice = "SingleChoice";
    public const string MultipleChoice = "MultipleChoice";
    public const string TrueFalse = "TrueFalse";
}
