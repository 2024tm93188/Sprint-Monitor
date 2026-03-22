using Microsoft.EntityFrameworkCore;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Data;

/// <summary>
/// Entity Framework DbContext for Sprint Monitor
/// </summary>
public class SprintMonitorDbContext : DbContext
{
    public SprintMonitorDbContext(DbContextOptions<SprintMonitorDbContext> options)
        : base(options)
    {
    }

    public DbSet<Team> Teams { get; set; }
    public DbSet<Sprint> Sprints { get; set; }
    public DbSet<RiskAssessment> RiskAssessments { get; set; }
    public DbSet<RiskFactor> RiskFactors { get; set; }
    public DbSet<Recommendation> Recommendations { get; set; }
    public DbSet<TeamSetting> TeamSettings { get; set; }
    public DbSet<ImplementationFeasibility> ImplementationFeasibilities { get; set; }
    public DbSet<RiskFeedback> RiskFeedbacks { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Team configuration
        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.TeamId);
            entity.HasIndex(e => e.TeamName).IsUnique();
            entity.Property(e => e.TeamName).IsRequired().HasMaxLength(100);
        });

        // Sprint configuration
        modelBuilder.Entity<Sprint>(entity =>
        {
            entity.HasKey(e => e.SprintId);
            entity.HasIndex(e => new { e.TeamId, e.SprintName }).IsUnique();
            entity.HasOne(e => e.Team)
                  .WithMany(t => t.Sprints)
                  .HasForeignKey(e => e.TeamId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // RiskAssessment configuration
        modelBuilder.Entity<RiskAssessment>(entity =>
        {
            entity.HasKey(e => e.AssessmentId);
            entity.HasOne(e => e.Team)
                  .WithMany(t => t.RiskAssessments)
                  .HasForeignKey(e => e.TeamId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // RiskFactor configuration
        modelBuilder.Entity<RiskFactor>(entity =>
        {
            entity.HasKey(e => e.FactorId);
            entity.HasOne(e => e.Assessment)
                  .WithMany(a => a.Factors)
                  .HasForeignKey(e => e.AssessmentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Recommendation configuration
        modelBuilder.Entity<Recommendation>(entity =>
        {
            entity.HasKey(e => e.RecommendationId);
            entity.HasOne(e => e.Assessment)
                  .WithMany(a => a.Recommendations)
                  .HasForeignKey(e => e.AssessmentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TeamSetting configuration
        modelBuilder.Entity<TeamSetting>(entity =>
        {
            entity.HasKey(e => e.SettingId);
            entity.HasIndex(e => new { e.TeamId, e.SettingKey }).IsUnique();
            entity.HasOne(e => e.Team)
                  .WithMany(t => t.Settings)
                  .HasForeignKey(e => e.TeamId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ImplementationFeasibility configuration
        modelBuilder.Entity<ImplementationFeasibility>(entity =>
        {
            entity.HasKey(e => e.FeasibilityId);
            entity.HasOne(e => e.Team)
                  .WithMany()
                  .HasForeignKey(e => e.TeamId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // RiskFeedback configuration
        modelBuilder.Entity<RiskFeedback>(entity =>
        {
            entity.HasKey(e => e.FeedbackId);
            entity.HasOne(e => e.Assessment)
                  .WithMany()
                  .HasForeignKey(e => e.AssessmentId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Sprint)
                  .WithMany()
                  .HasForeignKey(e => e.SprintId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.HasOne(e => e.Team)
                  .WithMany()
                  .HasForeignKey(e => e.TeamId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
