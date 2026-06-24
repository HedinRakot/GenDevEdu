namespace DevEdu.Api.Dtos;

public record RegisterRequest(string? Email, string? DisplayName, string? Password, string? Role);

public record LoginRequest(string? Email, string? Password);

public record RefreshRequest(string? RefreshToken);

public record UserDto(string Id, string Email, string DisplayName, List<string> Roles);

public record AuthResponse(string Token, string RefreshToken, UserDto User);

public record TokenPairDto(string Token, string RefreshToken);
