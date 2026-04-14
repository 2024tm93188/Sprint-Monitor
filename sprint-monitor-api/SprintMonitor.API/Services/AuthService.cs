using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

/// <summary>
/// Authentication service implementation with JWT support
/// </summary>
public class AuthService : IAuthService
{
    private readonly SprintMonitorDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        SprintMonitorDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Team)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }

            if (!user.IsActive)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Account is deactivated. Please contact administrator."
                };
            }

            if (!VerifyPassword(request.Password, user.PasswordHash))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }

            // Generate tokens
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            var tokenExpiry = DateTime.UtcNow.AddMinutes(GetTokenExpiryMinutes());

            // Update user with refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {Email} logged in successfully", user.Email);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                RefreshToken = refreshToken,
                TokenExpiry = tokenExpiry,
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {Email}", request.Email);
            return new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred during login"
            };
        }
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Email is already registered"
                };
            }

            // Validate team if provided
            if (request.TeamId.HasValue)
            {
                var teamExists = await _context.Teams.AnyAsync(t => t.TeamId == request.TeamId.Value);
                if (!teamExists)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Invalid team ID"
                    };
                }
            }

            var user = new User
            {
                Email = request.Email.ToLower(),
                FirstName = request.FirstName,
                LastName = request.LastName,
                PasswordHash = HashPassword(request.Password),
                Role = request.Role,
                TeamId = request.TeamId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Load team for response
            if (user.TeamId.HasValue)
            {
                await _context.Entry(user).Reference(u => u.Team).LoadAsync();
            }

            // Generate tokens
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            var tokenExpiry = DateTime.UtcNow.AddMinutes(GetTokenExpiryMinutes());

            // Update user with refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            _logger.LogInformation("New user registered: {Email}", user.Email);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful",
                Token = token,
                RefreshToken = refreshToken,
                TokenExpiry = tokenExpiry,
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Email}", request.Email);
            return new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred during registration"
            };
        }
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        try
        {
            var principal = GetPrincipalFromExpiredToken(request.Token);
            if (principal == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid token"
                };
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid token"
                };
            }

            var user = await _context.Users
                .Include(u => u.Team)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null || user.RefreshToken != request.RefreshToken ||
                user.RefreshTokenExpiry <= DateTime.UtcNow)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid or expired refresh token"
                };
            }

            // Generate new tokens
            var newToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();
            var tokenExpiry = DateTime.UtcNow.AddMinutes(GetTokenExpiryMinutes());

            // Update refresh token
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                Success = true,
                Message = "Token refreshed successfully",
                Token = newToken,
                RefreshToken = newRefreshToken,
                TokenExpiry = tokenExpiry,
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred during token refresh"
            };
        }
    }

    public async Task<bool> LogoutAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} logged out", userId);
        return true;
    }

    public async Task<UserDto?> GetUserByIdAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Team)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        return user != null ? MapToUserDto(user) : null;
    }

    public async Task<UserDto?> GetUserByEmailAsync(string email)
    {
        var user = await _context.Users
            .Include(u => u.Team)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

        return user != null ? MapToUserDto(user) : null;
    }

    public async Task<AuthResponseDto> ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "User not found"
            };
        }

        if (!VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "Current password is incorrect"
            };
        }

        user.PasswordHash = HashPassword(request.NewPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Password changed for user {UserId}", userId);

        return new AuthResponseDto
        {
            Success = true,
            Message = "Password changed successfully"
        };
    }

    public async Task<UserDto?> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.Team)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return null;

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;

        if (request.TeamId.HasValue)
        {
            var teamExists = await _context.Teams.AnyAsync(t => t.TeamId == request.TeamId.Value);
            if (teamExists)
            {
                user.TeamId = request.TeamId;
            }
        }

        await _context.SaveChangesAsync();

        // Reload team
        await _context.Entry(user).Reference(u => u.Team).LoadAsync();

        return MapToUserDto(user);
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _context.Users
            .Include(u => u.Team)
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();

        return users.Select(MapToUserDto);
    }

    public Task<bool> ValidateTokenAsync(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(GetJwtSecret());

        try
        {
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return Task.FromResult(true);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    public async Task<ForgotPasswordResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null)
            {
                // Don't reveal whether the email exists
                return new ForgotPasswordResponseDto
                {
                    Success = true,
                    Message = "If an account with that email exists, a reset token has been generated."
                };
            }

            // Generate a 6-digit reset token
            var resetToken = new Random().Next(100000, 999999).ToString();
            user.PasswordResetToken = resetToken;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Password reset token generated for {Email}", user.Email);

            return new ForgotPasswordResponseDto
            {
                Success = true,
                Message = "Password reset token generated. Use this token to reset your password.",
                ResetToken = resetToken // Returned directly (no email service in academic project)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password for {Email}", request.Email);
            return new ForgotPasswordResponseDto
            {
                Success = false,
                Message = "An error occurred. Please try again."
            };
        }
    }

    public async Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid email or reset token"
                };
            }

            // Verify token
            if (user.PasswordResetToken != request.Token ||
                user.PasswordResetTokenExpiry == null ||
                user.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid or expired reset token"
                };
            }

            // Update password
            user.PasswordHash = HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Password reset successful for {Email}", user.Email);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Password has been reset successfully. Please login with your new password."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset for {Email}", request.Email);
            return new AuthResponseDto
            {
                Success = false,
                Message = "An error occurred during password reset"
            };
        }
    }

    #region Private Helper Methods

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtSecret()));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("TeamId", user.TeamId?.ToString() ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(GetTokenExpiryMinutes()),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = _configuration["Jwt:Audience"],
            ValidateIssuer = true,
            ValidIssuer = _configuration["Jwt:Issuer"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtSecret())),
            ValidateLifetime = false // Allow expired tokens for refresh
        };

        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256,
                    StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }

    private static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    private string GetJwtSecret()
    {
        return _configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
    }

    private int GetTokenExpiryMinutes()
    {
        return int.TryParse(_configuration["Jwt:ExpiryMinutes"], out int minutes) ? minutes : 60;
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            TeamId = user.TeamId,
            TeamName = user.Team?.TeamName,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }

    #endregion
}
