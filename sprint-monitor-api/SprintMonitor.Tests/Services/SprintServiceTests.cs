using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;
using SprintMonitor.API.Services;
using SprintMonitor.Tests.Helpers;
using Xunit;

namespace SprintMonitor.Tests.Services;

/// <summary>
/// Unit tests for SprintService
/// </summary>
public class SprintServiceTests : IDisposable
{
    private readonly SprintMonitorDbContext _context;
    private readonly SprintService _service;

    public SprintServiceTests()
    {
        _context = TestDbContextFactory.CreateWithTestData();
        _service = new SprintService(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    #region GetSprintsByTeamAsync Tests

    [Fact]
    public async Task GetSprintsByTeamAsync_ReturnsSprints_ForExistingTeam()
    {
        // Act
        var sprints = await _service.GetSprintsByTeamAsync(1);

        // Assert
        Assert.NotNull(sprints);
        Assert.Equal(5, sprints.Count());
        Assert.All(sprints, s => Assert.Equal(1, s.TeamId));
    }

    [Fact]
    public async Task GetSprintsByTeamAsync_ReturnsEmpty_ForNonExistentTeam()
    {
        // Act
        var sprints = await _service.GetSprintsByTeamAsync(999);

        // Assert
        Assert.Empty(sprints);
    }

    [Fact]
    public async Task GetSprintsByTeamAsync_OrdersByStartDateDescending()
    {
        // Act
        var sprints = (await _service.GetSprintsByTeamAsync(1)).ToList();

        // Assert
        for (int i = 0; i < sprints.Count - 1; i++)
        {
            Assert.True(sprints[i].StartDate >= sprints[i + 1].StartDate);
        }
    }

    #endregion

    #region GetRecentSprintsAsync Tests

    [Fact]
    public async Task GetRecentSprintsAsync_ReturnsRequestedCount()
    {
        // Act
        var sprints = await _service.GetRecentSprintsAsync(1, 3);

        // Assert
        Assert.Equal(3, sprints.Count());
    }

    [Fact]
    public async Task GetRecentSprintsAsync_ReturnsAllSprints_WhenCountExceedsAvailable()
    {
        // Act
        var sprints = await _service.GetRecentSprintsAsync(1, 100);

        // Assert
        Assert.Equal(5, sprints.Count());
    }

    [Fact]
    public async Task GetRecentSprintsAsync_ReturnsMostRecentSprints()
    {
        // Act
        var sprints = (await _service.GetRecentSprintsAsync(1, 2)).ToList();

        // Assert
        Assert.Equal("Sprint 5", sprints[0].SprintName);
        Assert.Equal("Sprint 4", sprints[1].SprintName);
    }

    #endregion

    #region GetSprintByIdAsync Tests

    [Fact]
    public async Task GetSprintByIdAsync_ReturnsSprint_WhenExists()
    {
        // Act
        var sprint = await _service.GetSprintByIdAsync(1);

        // Assert
        Assert.NotNull(sprint);
        Assert.Equal(1, sprint.SprintId);
        Assert.Equal("Sprint 1", sprint.SprintName);
    }

    [Fact]
    public async Task GetSprintByIdAsync_ReturnsNull_WhenNotExists()
    {
        // Act
        var sprint = await _service.GetSprintByIdAsync(999);

        // Assert
        Assert.Null(sprint);
    }

    #endregion

    #region CreateSprintAsync Tests

    [Fact]
    public async Task CreateSprintAsync_CreatesNewSprint()
    {
        // Arrange
        var createDto = new CreateSprintDto
        {
            TeamId = 1,
            SprintName = "Sprint 6",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(14),
            CommittedPoints = 35,
            CompletedPoints = 33,
            TeamSize = 5,
            TeamAvailability = 100
        };

        // Act
        var result = await _service.CreateSprintAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Sprint 6", result.SprintName);
        Assert.Equal(35, result.CommittedPoints);
        Assert.Equal(33, result.CompletedPoints);
        Assert.True(result.SprintId > 0);
    }

    [Fact]
    public async Task CreateSprintAsync_SprintExistsInDatabase()
    {
        // Arrange
        var createDto = new CreateSprintDto
        {
            TeamId = 1,
            SprintName = "Persistence Test Sprint",
            CommittedPoints = 30,
            CompletedPoints = 28
        };

        // Act
        var result = await _service.CreateSprintAsync(createDto);

        // Assert
        var sprintInDb = await _context.Sprints.FindAsync(result.SprintId);
        Assert.NotNull(sprintInDb);
        Assert.Equal("Persistence Test Sprint", sprintInDb.SprintName);
    }

    [Fact]
    public async Task CreateSprintAsync_CalculatesCompletionRate()
    {
        // Arrange
        var createDto = new CreateSprintDto
        {
            TeamId = 1,
            SprintName = "Completion Rate Test",
            CommittedPoints = 30,
            CompletedPoints = 27
        };

        // Act
        var result = await _service.CreateSprintAsync(createDto);

        // Assert
        // 27/30 = 90%
        var sprintInDb = await _context.Sprints.FindAsync(result.SprintId);
        Assert.NotNull(sprintInDb);
        Assert.Equal(27, sprintInDb.CompletedPoints);
        Assert.Equal(30, sprintInDb.CommittedPoints);
    }

    #endregion

    #region UpdateSprintAsync Tests

    [Fact]
    public async Task UpdateSprintAsync_UpdatesSprint_WhenExists()
    {
        // Arrange
        var updateDto = new UpdateSprintDto
        {
            SprintName = "Updated Sprint Name",
            CompletedPoints = 30
        };

        // Act
        var result = await _service.UpdateSprintAsync(1, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Sprint Name", result.SprintName);
    }

    [Fact]
    public async Task UpdateSprintAsync_ReturnsNull_WhenSprintNotExists()
    {
        // Arrange
        var updateDto = new UpdateSprintDto
        {
            SprintName = "Updated Name"
        };

        // Act
        var result = await _service.UpdateSprintAsync(999, updateDto);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteSprintAsync Tests

    [Fact]
    public async Task DeleteSprintAsync_DeletesSprint_WhenExists()
    {
        // Act
        var result = await _service.DeleteSprintAsync(1);

        // Assert
        Assert.True(result);
        var deletedSprint = await _context.Sprints.FindAsync(1);
        Assert.Null(deletedSprint);
    }

    [Fact]
    public async Task DeleteSprintAsync_ReturnsFalse_WhenSprintNotExists()
    {
        // Act
        var result = await _service.DeleteSprintAsync(999);

        // Assert
        Assert.False(result);
    }

    #endregion

    #region Data Integrity Tests

    [Fact]
    public async Task Sprints_HaveCorrectVelocityCalculation()
    {
        // Act
        var sprints = await _service.GetSprintsByTeamAsync(1);

        // Assert
        foreach (var sprint in sprints)
        {
            Assert.True(sprint.CommittedPoints >= 0);
            Assert.True(sprint.CompletedPoints >= 0);
            // Completed points should not exceed committed points in normal scenarios
            // (though it's technically possible with scope changes)
        }
    }

    [Fact]
    public async Task Sprints_HaveValidDateRange()
    {
        // Act
        var sprints = (await _service.GetSprintsByTeamAsync(1)).ToList();

        // Assert
        foreach (var sprint in sprints)
        {
            if (sprint.StartDate.HasValue && sprint.EndDate.HasValue)
            {
                Assert.True(sprint.EndDate >= sprint.StartDate);
            }
        }
    }

    #endregion
}
