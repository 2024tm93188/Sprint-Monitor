using Microsoft.AspNetCore.Mvc;
using Moq;
using SprintMonitor.API.Controllers;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Services;
using Xunit;

namespace SprintMonitor.Tests.Controllers;

/// <summary>
/// Unit tests for SprintsController
/// </summary>
public class SprintsControllerTests
{
    private readonly Mock<ISprintService> _mockSprintService;
    private readonly Mock<ICsvImportService> _mockCsvImportService;
    private readonly SprintsController _controller;

    public SprintsControllerTests()
    {
        _mockSprintService = new Mock<ISprintService>();
        _mockCsvImportService = new Mock<ICsvImportService>();
        _controller = new SprintsController(_mockSprintService.Object, _mockCsvImportService.Object);
    }

    #region GetSprintsByTeam Tests

    [Fact]
    public async Task GetSprintsByTeam_ReturnsOkWithSprints()
    {
        // Arrange
        var sprints = new List<SprintDto>
        {
            new SprintDto { SprintId = 1, TeamId = 1, SprintName = "Sprint 1", CommittedPoints = 30, CompletedPoints = 28 },
            new SprintDto { SprintId = 2, TeamId = 1, SprintName = "Sprint 2", CommittedPoints = 32, CompletedPoints = 30 }
        };
        _mockSprintService.Setup(s => s.GetSprintsByTeamAsync(1)).ReturnsAsync(sprints);

        // Act
        var result = await _controller.GetSprintsByTeam(1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSprints = Assert.IsAssignableFrom<IEnumerable<SprintDto>>(okResult.Value);
        Assert.Equal(2, returnedSprints.Count());
    }

    [Fact]
    public async Task GetSprintsByTeam_ReturnsEmptyList_WhenNoSprints()
    {
        // Arrange
        _mockSprintService.Setup(s => s.GetSprintsByTeamAsync(999)).ReturnsAsync(new List<SprintDto>());

        // Act
        var result = await _controller.GetSprintsByTeam(999);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSprints = Assert.IsAssignableFrom<IEnumerable<SprintDto>>(okResult.Value);
        Assert.Empty(returnedSprints);
    }

    #endregion

    #region GetRecentSprints Tests

    [Fact]
    public async Task GetRecentSprints_ReturnsOkWithSprints()
    {
        // Arrange
        var sprints = new List<SprintDto>
        {
            new SprintDto { SprintId = 5, TeamId = 1, SprintName = "Sprint 5" },
            new SprintDto { SprintId = 4, TeamId = 1, SprintName = "Sprint 4" }
        };
        _mockSprintService.Setup(s => s.GetRecentSprintsAsync(1, 5)).ReturnsAsync(sprints);

        // Act
        var result = await _controller.GetRecentSprints(1, 5);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSprints = Assert.IsAssignableFrom<IEnumerable<SprintDto>>(okResult.Value);
        Assert.Equal(2, returnedSprints.Count());
    }

    [Fact]
    public async Task GetRecentSprints_UsesDefaultCount()
    {
        // Arrange
        _mockSprintService.Setup(s => s.GetRecentSprintsAsync(1, 10)).ReturnsAsync(new List<SprintDto>());

        // Act
        var result = await _controller.GetRecentSprints(1);

        // Assert
        _mockSprintService.Verify(s => s.GetRecentSprintsAsync(1, 10), Times.Once);
    }

    #endregion

    #region GetSprint Tests

    [Fact]
    public async Task GetSprint_ReturnsOk_WhenSprintExists()
    {
        // Arrange
        var sprint = new SprintDto { SprintId = 1, TeamId = 1, SprintName = "Sprint 1", CommittedPoints = 30 };
        _mockSprintService.Setup(s => s.GetSprintByIdAsync(1)).ReturnsAsync(sprint);

        // Act
        var result = await _controller.GetSprint(1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSprint = Assert.IsType<SprintDto>(okResult.Value);
        Assert.Equal(1, returnedSprint.SprintId);
        Assert.Equal("Sprint 1", returnedSprint.SprintName);
    }

    [Fact]
    public async Task GetSprint_ReturnsNotFound_WhenSprintDoesNotExist()
    {
        // Arrange
        _mockSprintService.Setup(s => s.GetSprintByIdAsync(999)).ReturnsAsync((SprintDto?)null);

        // Act
        var result = await _controller.GetSprint(999);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    #endregion

    #region CreateSprint Tests

    [Fact]
    public async Task CreateSprint_ReturnsCreated_WhenValidData()
    {
        // Arrange
        var createDto = new CreateSprintDto
        {
            TeamId = 1,
            SprintName = "Sprint 6",
            CommittedPoints = 30,
            CompletedPoints = 28
        };
        var createdSprint = new SprintDto
        {
            SprintId = 6,
            TeamId = 1,
            SprintName = "Sprint 6",
            CommittedPoints = 30,
            CompletedPoints = 28
        };
        _mockSprintService.Setup(s => s.CreateSprintAsync(It.IsAny<CreateSprintDto>())).ReturnsAsync(createdSprint);

        // Act
        var result = await _controller.CreateSprint(createDto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(SprintsController.GetSprint), createdResult.ActionName);
        var returnedSprint = Assert.IsType<SprintDto>(createdResult.Value);
        Assert.Equal("Sprint 6", returnedSprint.SprintName);
    }

    [Fact]
    public async Task CreateSprint_ReturnsBadRequest_WhenNegativeCommittedPoints()
    {
        // Arrange
        var createDto = new CreateSprintDto
        {
            TeamId = 1,
            SprintName = "Sprint 6",
            CommittedPoints = -5,
            CompletedPoints = 28
        };

        // Act
        var result = await _controller.CreateSprint(createDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateSprint_ReturnsBadRequest_WhenNegativeCompletedPoints()
    {
        // Arrange
        var createDto = new CreateSprintDto
        {
            TeamId = 1,
            SprintName = "Sprint 6",
            CommittedPoints = 30,
            CompletedPoints = -10
        };

        // Act
        var result = await _controller.CreateSprint(createDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    #endregion

    #region UpdateSprint Tests

    [Fact]
    public async Task UpdateSprint_ReturnsOk_WhenSprintExists()
    {
        // Arrange
        var updateDto = new UpdateSprintDto { SprintName = "Updated Sprint" };
        var updatedSprint = new SprintDto { SprintId = 1, SprintName = "Updated Sprint" };
        _mockSprintService.Setup(s => s.UpdateSprintAsync(1, It.IsAny<UpdateSprintDto>())).ReturnsAsync(updatedSprint);

        // Act
        var result = await _controller.UpdateSprint(1, updateDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedSprint = Assert.IsType<SprintDto>(okResult.Value);
        Assert.Equal("Updated Sprint", returnedSprint.SprintName);
    }

    [Fact]
    public async Task UpdateSprint_ReturnsNotFound_WhenSprintDoesNotExist()
    {
        // Arrange
        var updateDto = new UpdateSprintDto { SprintName = "Updated Sprint" };
        _mockSprintService.Setup(s => s.UpdateSprintAsync(999, It.IsAny<UpdateSprintDto>())).ReturnsAsync((SprintDto?)null);

        // Act
        var result = await _controller.UpdateSprint(999, updateDto);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    #endregion

    #region DeleteSprint Tests

    [Fact]
    public async Task DeleteSprint_ReturnsNoContent_WhenSprintExists()
    {
        // Arrange
        _mockSprintService.Setup(s => s.DeleteSprintAsync(1)).ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteSprint(1);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteSprint_ReturnsNotFound_WhenSprintDoesNotExist()
    {
        // Arrange
        _mockSprintService.Setup(s => s.DeleteSprintAsync(999)).ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteSprint(999);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    #endregion
}
