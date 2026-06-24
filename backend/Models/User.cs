using MongoDB.Bson.Serialization.Attributes;

namespace DevEdu.Api.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(MongoDB.Bson.BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
