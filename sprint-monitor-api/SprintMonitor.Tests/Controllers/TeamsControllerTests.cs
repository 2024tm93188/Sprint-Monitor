using Microsoft.AspNetCore.Mvc;
using Moq;
using SprintMonitor.API.Controllers;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Services;
using Xunit;

namespace SprintMonitor.Tests.Controllers;

/// <summary>
/// Unit tests for TeamsController
/// </summary>
public class TeamsControllerTests
{
    private readonly Mock<ITeamService> _mockTeamService;
    private readonly TeamsController _controller;

    public TeamsControllerTests()
    {
        _mockTeamService = new Mock<ITeamService>();
        _controller = new TeamsController(_mockTeamService.Object);
    }

    #region GetAllTeams Tests

    [Fact]
    public async Task GetAllTeams_ReturnsOkWithTeams()
    {
        // Arrange
        var teams = new List<TeamDto>
        {
            new TeamDto { TeamId = 1, TeamName = "Alpha Team", Description = "Test team 1" },
            new TeamDto { TeamId = 2, TeamName = "Beta Team", Description = "Test team 2" }
        };
        _mockTeamService.Setup(s => s.GetAllTeamsAsync()).ReturnsAsync(teams);

        // Act
        var result = await _controller.GetAllTeams();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedTeams = Assert.IsAssignableFrom<IEnumerable<TeamDto>>(okResult.Value);
        Assert.Equal(2, returnedTeams.Count());
    }

    [Fact]
    public async Task GetAllTeams_ReturnsEmptyListWhenNoTeams()
    {
        // Arrange
        _mockTeamService.Setup(s => s.GetAllTeamsAsync()).ReturnsAsync(new List<TeamDto>());

        // Act
        var result = await _controller.GetAllTeams();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedTeams = Assert.IsAssignableFrom<IEnumerable<TeamDto>>(okResult.Value);
        Assert.Empty(returnedTeams);
    }

    #endregion

    #region GetTeam Tests

    [Fact]
    public async Task GetTeam_ReturnsOkWithTeam_WhenTeamExists()
    {
        // Arrange
        var team = new TeamDto { TeamId = 1, TeamName = "Alpha Team", Description = "Test team" };
        _mockTeamService.Setup(s => s.GetTeamByIdAsync(1)).ReturnsAsync(team);

        // Act
        var result = await _controller.GetTeam(1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedTeam = Assert.IsType<TeamDto>(okResult.Value);
        Assert.Equal(1, returnedTeam.TeamId);
        Assert.Equal("Alpha Team", returnedTeam.TeamName);
    }

    [Fact]
    public async Task GetTeam_ReturnsNotFound_WhenTeamDoesNotExist()
    {
        // Arrange
        _mockTeamService.Setup(s => s.GetTeamByIdAsync(999)).ReturnsAsync((TeamDto?)null);

        // Act
        var result = await _controller.GetTeam(999);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    #endregion

    #region CreateTeam Tests

    [Fact]
    public async Task CreateTeam_ReturnsCreated_WhenValidData()
    {
        // Arrange
        var createDto = new CreateTeamDto { TeamName = "New Team", Description = "New team description" };
        var createdTeam = new TeamDto { TeamId = 3, TeamName = "New Team", Description = "New team description" };
        _mockTeamService.Setup(s => s.CreateTeamAsync(It.IsAny<CreateTeamDto>())).ReturnsAsync(createdTeam);

        // Act
        var result = await _controller.CreateTeam(createDto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(TeamsController.GetTeam), createdResult.ActionName);
        var returnedTeam = Assert.IsType<TeamDto>(createdResult.Value);
        Assert.Equal("New Team", returnedTeam.TeamName);
    }

    [Fact]
    public async Task CreateTeam_ReturnsBadRequest_WhenNameIsEmpty()
    {
        // Arrange
        var createDto = new CreateTeamDto { TeamName = "", Description = "Description" };

        // Act
        var result = await _controller.CreateTeam(createDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateTeam_ReturnsBadRequest_WhenNameIsWhitespace()
    {
        // Arrange
        var createDto = new CreateTeamDto { TeamName = "   ", Description = "Description" };

        // Act
        var result = await _controller.CreateTeam(createDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    #endregion

    #region UpdateTeam Tests

    [Fact]
    public async Task UpdateTeam_ReturnsOk_WhenTeamExists()
    {
        // Arrange
        var updateDto = new UpdateTeamDto { TeamName = "Updated Name" };
        var updatedTeam = new TeamDto { TeamId = 1, TeamName = "Updated Name" };
        _mockTeamService.Setup(s => s.UpdateTeamAsync(1, It.IsAny<UpdateTeamDto>())).ReturnsAsync(updatedTeam);

        // Act
        var result = await _controller.UpdateTeam(1, updateDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedTeam = Assert.IsType<TeamDto>(okResult.Value);
        Assert.Equal("Updated Name", returnedTeam.TeamName);
    }

    [Fact]
    public async Task UpdateTeam_ReturnsNotFound_WhenTeamDoesNotExist()
    {
        // Arrange
        var updateDto = new UpdateTeamDto { TeamName = "Updated Name" };
        _mockTeamService.Setup(s => s.UpdateTeamAsync(999, It.IsAny<UpdateTeamDto>())).ReturnsAsync((TeamDto?)null);

        // Act
        var result = await _controller.UpdateTeam(999, updateDto);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    #endregion

    #region DeleteTeam Tests

    [Fact]
    public async Task DeleteTeam_ReturnsNoContent_WhenTeamExists()
    {
        // Arrange
        _mockTeamService.Setup(s => s.DeleteTeamAsync(1)).ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteTeam(1);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteTeam_ReturnsNotFound_WhenTeamDoesNotExist()
    {
        // Arrange
        _mockTeamService.Setup(s => s.DeleteTeamAsync(999)).ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteTeam(999);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    #endregion
}
