using SprintMonitor.API.DTOs;

namespace SprintMonitor.API.Services;

/// <summary>
/// Authentication service interface
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Authenticate user with email and password
    /// </summary>
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);

    /// <summary>
    /// Register a new user
    /// </summary>
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);

    /// <summary>
    /// Refresh JWT token using refresh token
    /// </summary>
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request);

    /// <summary>
    /// Logout user and invalidate refresh token
    /// </summary>
    Task<bool> LogoutAsync(int userId);

    /// <summary>
    /// Get user by ID
    /// </summary>
    Task<UserDto?> GetUserByIdAsync(int userId);

    /// <summary>
    /// Get user by email
    /// </summary>
    Task<UserDto?> GetUserByEmailAsync(string email);

    /// <summary>
    /// Change user password
    /// </summary>
    Task<AuthResponseDto> ChangePasswordAsync(int userId, ChangePasswordRequestDto request);

    /// <summary>
    /// Update user profile
    /// </summary>
    Task<UserDto?> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);

    /// <summary>
    /// Get all users (admin only)
    /// </summary>
    Task<IEnumerable<UserDto>> GetAllUsersAsync();

    /// <summary>
    /// Validate JWT token
    /// </summary>
    Task<bool> ValidateTokenAsync(string token);
}
