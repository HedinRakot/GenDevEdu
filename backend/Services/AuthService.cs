using System.Text.RegularExpressions;
using DevEdu.Api.Dtos;
using DevEdu.Api.Models;
using MongoDB.Driver;

namespace DevEdu.Api.Services;

public class AuthService
{
    private readonly MongoContext _db;
    private readonly JwtService _jwt;

    private static readonly Regex EmailRegex =
        new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

    public AuthService(MongoContext db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<ServiceResult<AuthResponse>> RegisterAsync(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || !EmailRegex.IsMatch(req.Email))
            return ServiceResult<AuthResponse>.Validation("Invalid email.");
        if (string.IsNullOrWhiteSpace(req.DisplayName))
            return ServiceResult<AuthResponse>.Validation("displayName is required.");
        if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
            return ServiceResult<AuthResponse>.Validation("Password must be at least 6 characters.");

        var role = string.IsNullOrWhiteSpace(req.Role) ? Roles.Learner : req.Role;
        if (role != Roles.Learner && role != Roles.Author)
            return ServiceResult<AuthResponse>.Validation("role must be Learner or Author.");

        var email = req.Email.Trim().ToLowerInvariant();
        var existing = await _db.Users.Find(u => u.Email == email).AnyAsync();
        if (existing)
            return ServiceResult<AuthResponse>.Validation("Email already registered.");

        var user = new User
        {
            Email = email,
            DisplayName = req.DisplayName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Roles = new List<string> { role },
        };
        await _db.Users.InsertOneAsync(user);

        return ServiceResult<AuthResponse>.Ok(await BuildAuthResponseAsync(user));
    }

    public async Task<ServiceResult<AuthResponse>> LoginAsync(LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return ServiceResult<AuthResponse>.Unauthorized("Invalid credentials.");

        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.Find(u => u.Email == email).FirstOrDefaultAsync();
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return ServiceResult<AuthResponse>.Unauthorized("Invalid credentials.");

        return ServiceResult<AuthResponse>.Ok(await BuildAuthResponseAsync(user));
    }

    public async Task<ServiceResult<TokenPairDto>> RefreshAsync(RefreshRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RefreshToken))
            return ServiceResult<TokenPairDto>.Unauthorized("Invalid refresh token.");

        var rotated = await _jwt.RotateRefreshTokenAsync(req.RefreshToken);
        if (rotated is null)
            return ServiceResult<TokenPairDto>.Unauthorized("Invalid or expired refresh token.");

        var (user, newRefresh) = rotated.Value;
        var token = _jwt.CreateAccessToken(user);
        return ServiceResult<TokenPairDto>.Ok(new TokenPairDto(token, newRefresh));
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(User user)
    {
        var token = _jwt.CreateAccessToken(user);
        var refresh = await _jwt.CreateRefreshTokenAsync(user.Id);
        var dto = new UserDto(user.Id, user.Email, user.DisplayName, user.Roles);
        return new AuthResponse(token, refresh, dto);
    }
}
