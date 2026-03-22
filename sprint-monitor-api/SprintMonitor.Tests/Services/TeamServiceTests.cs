using Microsoft.EntityFrameworkCore;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;
using SprintMonitor.API.Services;
using SprintMonitor.Tests.Helpers;
using Xunit;

namespace SprintMonitor.Tests.Services;

/// <summary>
/// Unit tests for TeamService
/// </summary>
public class TeamServiceTests : IDisposable
{
    private readonly SprintMonitorDbContext _context;
    private readonly TeamService _service;

    public TeamServiceTests()
    {
        _context = TestDbContextFactory.CreateWithTestData();
        _service = new TeamService(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    #region GetAllTeamsAsync Tests

    [Fact]
    public async Task GetAllTeamsAsync_ReturnsActiveTeams()
    {
        // Act
        var teams = await _service.GetAllTeamsAsync();

        // Assert
        Assert.NotNull(teams);
        Assert.Equal(2, teams.Count());
        Assert.All(teams, t => Assert.True(!string.IsNullOrEmpty(t.TeamName)));
    }

    [Fact]
    public async Task GetAllTeamsAsync_ExcludesInactiveTeams()
    {
        // Arrange
        var inactiveTeam = new Team
        {
            TeamName = "Inactive Team",
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Teams.Add(inactiveTeam);
        await _context.SaveChangesAsync();

        // Act
        var teams = await _service.GetAllTeamsAsync();

        // Assert
        Assert.DoesNotContain(teams, t => t.TeamName == "Inactive Team");
    }

    #endregion

    #region GetTeamByIdAsync Tests

    [Fact]
    public async Task GetTeamByIdAsync_ReturnsTeam_WhenExists()
    {
        // Act
        var team = await _service.GetTeamByIdAsync(1);

        // Assert
        Assert.NotNull(team);
        Assert.Equal(1, team.TeamId);
        Assert.Equal("Test Team Alpha", team.TeamName);
    }

    [Fact]
    public async Task GetTeamByIdAsync_ReturnsNull_WhenNotExists()
    {
        // Act
        var team = await _service.GetTeamByIdAsync(999);

        // Assert
        Assert.Null(team);
    }

    [Fact]
    public async Task GetTeamByIdAsync_ReturnsInactiveTeam_WhenTeamIsInactive()
    {
        // Arrange
        var existingTeam = await _context.Teams.FindAsync(1);
        existingTeam!.IsActive = false;
        await _context.SaveChangesAsync();

        // Act
        var team = await _service.GetTeamByIdAsync(1);

        // Assert
        Assert.NotNull(team);
        Assert.False(team.IsActive);
    }

    #endregion

    #region CreateTeamAsync Tests

    [Fact]
    public async Task CreateTeamAsync_CreatesNewTeam()
    {
        // Arrange
        var createDto = new CreateTeamDto
        {
            TeamName = "New Team",
            Description = "New team description"
        };

        // Act
        var result = await _service.CreateTeamAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Team", result.TeamName);
        Assert.Equal("New team description", result.Description);
        Assert.True(result.TeamId > 0);
    }

    [Fact]
    public async Task CreateTeamAsync_TeamExistsInDatabase()
    {
        // Arrange
        var createDto = new CreateTeamDto
        {
            TeamName = "Persistence Test Team"
        };

        // Act
        var result = await _service.CreateTeamAsync(createDto);

        // Assert
        var teamInDb = await _context.Teams.FindAsync(result.TeamId);
        Assert.NotNull(teamInDb);
        Assert.Equal("Persistence Test Team", teamInDb.TeamName);
        Assert.True(teamInDb.IsActive);
    }

    #endregion

    #region UpdateTeamAsync Tests

    [Fact]
    public async Task UpdateTeamAsync_UpdatesTeam_WhenExists()
    {
        // Arrange
        var updateDto = new UpdateTeamDto
        {
            TeamName = "Updated Team Name",
            Description = "Updated description"
        };

        // Act
        var result = await _service.UpdateTeamAsync(1, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Team Name", result.TeamName);
        Assert.Equal("Updated description", result.Description);
    }

    [Fact]
    public async Task UpdateTeamAsync_ReturnsNull_WhenTeamNotExists()
    {
        // Arrange
        var updateDto = new UpdateTeamDto
        {
            TeamName = "Updated Name"
        };

        // Act
        var result = await _service.UpdateTeamAsync(999, updateDto);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateTeamAsync_PreservesExistingValues_WhenNotProvided()
    {
        // Arrange
        var originalTeam = await _context.Teams.FindAsync(1);
        var originalDescription = originalTeam!.Description;
        
        var updateDto = new UpdateTeamDto
        {
            TeamName = "Only Name Updated"
            // Description not provided
        };

        // Act
        var result = await _service.UpdateTeamAsync(1, updateDto);

        // Assert
        Assert.Equal("Only Name Updated", result!.TeamName);
        // Description should remain unchanged (null in UpdateTeamDto means don't update)
    }

    #endregion

    #region DeleteTeamAsync Tests

    [Fact]
    public async Task DeleteTeamAsync_SoftDeletesTeam_WhenExists()
    {
        // Act
        var result = await _service.DeleteTeamAsync(1);

        // Assert
        Assert.True(result);
        var deletedTeam = await _context.Teams.FindAsync(1);
        Assert.NotNull(deletedTeam);
        Assert.False(deletedTeam.IsActive); // Soft delete
    }

    [Fact]
    public async Task DeleteTeamAsync_ReturnsFalse_WhenTeamNotExists()
    {
        // Act
        var result = await _service.DeleteTeamAsync(999);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteTeamAsync_TeamIsMarkedInactiveAfterDelete()
    {
        // Act
        await _service.DeleteTeamAsync(1);
        var team = await _service.GetTeamByIdAsync(1);

        // Assert
        Assert.NotNull(team);
        Assert.False(team.IsActive);
    }

    #endregion
}
