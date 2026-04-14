using System.ComponentModel.DataAnnotations;

namespace SprintMonitor.API.Models;

/// <summary>
/// User roles in the system
/// </summary>
public enum UserRole
{
    Developer,
    ScrumMaster,
    TeamLead,
    Admin
}

/// <summary>
/// User entity for authentication and authorization
/// </summary>
public class User
{
    [Key]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; } = UserRole.Developer;

    /// <summary>
    /// Optional team association
    /// </summary>
    public int? TeamId { get; set; }

    public Team? Team { get; set; }

    /// <summary>
    /// Refresh token for JWT refresh
    /// </summary>
    [MaxLength(500)]
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Refresh token expiry time
    /// </summary>
    public DateTime? RefreshTokenExpiry { get; set; }

    /// <summary>
    /// Password reset token (6-digit code)
    /// </summary>
    [MaxLength(100)]
    public string? PasswordResetToken { get; set; }

    /// <summary>
    /// Password reset token expiry (15 minutes)
    /// </summary>
    public DateTime? PasswordResetTokenExpiry { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    // Computed property
    public string FullName => $"{FirstName} {LastName}";
}
