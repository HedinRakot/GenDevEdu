using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DevEdu.Api.Models;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "devedu";
    public string Audience { get; set; } = "devedu";
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 14;
}

public class JwtService
{
    private readonly JwtOptions _options;
    private readonly MongoContext _db;

    public JwtService(JwtOptions options, MongoContext db)
    {
        _options = options;
        _db = db;
    }

    public string CreateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("displayName", user.DisplayName),
            new(ClaimTypes.NameIdentifier, user.Id),
        };
        foreach (var role in user.Roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<string> CreateRefreshTokenAsync(string userId)
    {
        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var entity = new RefreshToken
        {
            Token = raw,
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(_options.RefreshTokenDays),
        };
        await _db.RefreshTokens.InsertOneAsync(entity);
        return raw;
    }

    /// <summary>
    /// Validates a refresh token, rotates it (revokes old, issues new), and
    /// returns the owning user plus the new refresh token string.
    /// </summary>
    public async Task<(User user, string newRefresh)?> RotateRefreshTokenAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .Find(t => t.Token == refreshToken && !t.Revoked)
            .FirstOrDefaultAsync();

        if (stored is null || stored.ExpiresAt < DateTime.UtcNow)
            return null;

        var user = await _db.Users.Find(u => u.Id == stored.UserId).FirstOrDefaultAsync();
        if (user is null)
            return null;

        await _db.RefreshTokens.UpdateOneAsync(
            t => t.Id == stored.Id,
            Builders<RefreshToken>.Update.Set(t => t.Revoked, true));

        var newRefresh = await CreateRefreshTokenAsync(user.Id);
        return (user, newRefresh);
    }
}
