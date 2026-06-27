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
    public const string AdminOnly = "AdminOnly";
}
