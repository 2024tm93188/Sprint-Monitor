using Moq;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;
using SprintMonitor.API.Services;
using SprintMonitor.Tests.Helpers;
using Xunit;

namespace SprintMonitor.Tests.Services;

/// <summary>
/// Unit tests for RiskAssessmentService
/// </summary>
public class RiskAssessmentServiceTests : IDisposable
{
    private readonly SprintMonitorDbContext _context;
    private readonly Mock<IMetricsService> _mockMetricsService;
    private readonly RiskAssessmentService _service;

    public RiskAssessmentServiceTests()
    {
        _context = TestDbContextFactory.CreateWithTestData();
        _mockMetricsService = new Mock<IMetricsService>();
        _service = new RiskAssessmentService(_context, _mockMetricsService.Object);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    #region Risk Level Determination Tests

    [Fact]
    public async Task EvaluateRiskAsync_ReturnsLowRisk_ForLowScoreMetrics()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 30,
            VelocityStandardDeviation = 2,
            VelocityCoefficient = 0.07m,
            EffectiveCapacity = 24,
            CVR = 0.9m,
            SpilloverRate = 10,
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 24
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 27,
            TeamAvailability = 100,
            ExternalDependencies = 1
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        Assert.Equal("LOW", result.RiskLevel);
        Assert.True(result.TotalScore <= 3);
    }

    [Fact]
    public async Task EvaluateRiskAsync_ReturnsHighRisk_ForModerateMetricsWithAvailabilityPenalty()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 30,
            VelocityStandardDeviation = 5,
            VelocityCoefficient = 0.20m,
            EffectiveCapacity = 30,
            CVR = 1.05m,
            SpilloverRate = 25,
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 24
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 32,
            TeamAvailability = 90,
            ExternalDependencies = 2
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        Assert.Equal("HIGH", result.RiskLevel);
        Assert.True(result.TotalScore > 6);
    }

    [Fact]
    public async Task EvaluateRiskAsync_ReturnsHighRisk_ForHighRiskMetrics()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 25,
            VelocityStandardDeviation = 8,
            VelocityCoefficient = 0.32m,
            EffectiveCapacity = 20,
            CVR = 1.4m,
            SpilloverRate = 50,
            SprintCount = 5,
            VelocityTrend = "declining",
            RecommendedCommitment = 20
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 35,
            TeamAvailability = 70,
            ExternalDependencies = 4
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        Assert.Equal("HIGH", result.RiskLevel);
        Assert.True(result.TotalScore > 6);
    }

    #endregion

    #region Risk Factors Tests

    [Fact]
    public async Task EvaluateRiskAsync_IncludesCommitmentRiskFactor()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 25,
            VelocityStandardDeviation = 2.5m,
            VelocityCoefficient = 0.1m,
            EffectiveCapacity = 20,
            CVR = 1.2m,
            SpilloverRate = 20,
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 20
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 30, // Higher than average velocity
            TeamAvailability = 100
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        Assert.Contains(result.Factors, f => f.FactorName.Contains("Commitment") || f.FactorName.Contains("CVR"));
    }

    [Fact]
    public async Task EvaluateRiskAsync_IncludesVelocityVariabilityFactor()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 30,
            VelocityStandardDeviation = 9,
            VelocityCoefficient = 0.30m, // High variability
            EffectiveCapacity = 24,
            CVR = 1.0m,
            SpilloverRate = 20,
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 24
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 30,
            TeamAvailability = 100
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        Assert.Contains(result.Factors, f => 
            f.FactorName.Contains("Velocity") || 
            f.FactorName.Contains("Variability") ||
            f.FactorName.Contains("CV"));
    }

    [Fact]
    public async Task EvaluateRiskAsync_IncludesSpilloverRiskFactor()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 30,
            VelocityStandardDeviation = 3,
            VelocityCoefficient = 0.1m,
            EffectiveCapacity = 24,
            CVR = 1.0m,
            SpilloverRate = 45, // High spillover
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 24
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 30,
            TeamAvailability = 100
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        Assert.Contains(result.Factors, f => f.FactorName.Contains("Spillover"));
    }

    #endregion

    #region Recommendations Tests

    [Fact]
    public async Task EvaluateRiskAsync_GeneratesRecommendations_ForHighRisk()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 25,
            VelocityStandardDeviation = 6.25m,
            VelocityCoefficient = 0.25m,
            EffectiveCapacity = 20,
            CVR = 1.3m,
            SpilloverRate = 40,
            SprintCount = 5,
            VelocityTrend = "declining",
            RecommendedCommitment = 20
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 35,
            TeamAvailability = 80,
            ExternalDependencies = 3
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        Assert.NotEmpty(result.Recommendations);
        Assert.All(result.Recommendations, r =>
        {
            Assert.NotNull(r.Title);
            Assert.NotNull(r.Description);
            Assert.NotNull(r.Priority);
        });
    }

    [Fact]
    public async Task EvaluateRiskAsync_RecommendationsHavePriority()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 25,
            VelocityStandardDeviation = 7.5m,
            VelocityCoefficient = 0.3m,
            EffectiveCapacity = 20,
            CVR = 1.4m,
            SpilloverRate = 50,
            SprintCount = 5,
            VelocityTrend = "declining",
            RecommendedCommitment = 20
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 40,
            TeamAvailability = 70
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        var validPriorities = new[] { "CRITICAL", "HIGH", "MEDIUM", "LOW" };
        Assert.All(result.Recommendations, r =>
        {
            Assert.Contains(r.Priority, validPriorities);
        });
    }

    [Fact]
    public async Task EvaluateRiskAsync_RecommendsReducingCommitment_WhenOvercommitting()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 25,
            VelocityStandardDeviation = 2.5m,
            VelocityCoefficient = 0.1m,
            EffectiveCapacity = 20,
            CVR = 1.6m, // 60% overcommitment
            SpilloverRate = 20,
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 20
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 40, // Way over velocity
            TeamAvailability = 100
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        Assert.Contains(result.Recommendations, r =>
            r.Title.Contains("Reduce") || 
            r.Title.Contains("Commitment") ||
            r.Description.Contains("reduce") ||
            r.Description.Contains("commitment"));
    }

    #endregion

    #region Confidence Calculation Tests

    [Fact]
    public async Task EvaluateRiskAsync_HighConfidence_WithManyHistoricalSprints()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 30,
            VelocityStandardDeviation = 4.5m,
            VelocityCoefficient = 0.15m,
            EffectiveCapacity = 24,
            CVR = 1.0m,
            SpilloverRate = 20,
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 24
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 30,
            TeamAvailability = 100
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        // With 5 sprints of test data, confidence should be MEDIUM
        Assert.True(result.Confidence == "MEDIUM" || result.Confidence == "HIGH");
    }

    [Fact]
    public async Task EvaluateRiskAsync_LowConfidence_WithFewSprints()
    {
        // Arrange - Clear existing sprints and add only 2
        _context.Sprints.RemoveRange(_context.Sprints.Where(s => s.TeamId == 2));
        _context.Sprints.Add(new Sprint
        {
            TeamId = 2,
            SprintName = "Sprint 1",
            CommittedPoints = 30,
            CompletedPoints = 28,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 28,
            VelocityStandardDeviation = 0,
            VelocityCoefficient = 0,
            EffectiveCapacity = 22.4m,
            CVR = 1.0m,
            SpilloverRate = 0,
            SprintCount = 1,
            VelocityTrend = "stable",
            RecommendedCommitment = 22
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 2,
            PlannedCommitment = 28,
            TeamAvailability = 100
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        // With only 1-2 sprints, confidence should be LOW
        Assert.Equal("LOW", result.Confidence);
    }

    #endregion

    #region Assessment Persistence Tests

    [Fact]
    public async Task EvaluateRiskAsync_SavesAssessmentToDatabase()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 30,
            VelocityStandardDeviation = 3,
            VelocityCoefficient = 0.1m,
            EffectiveCapacity = 24,
            CVR = 1.0m,
            SpilloverRate = 10,
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 24
        });

        var request = new RiskAssessmentRequestDto
        {
            TeamId = 1,
            PlannedCommitment = 30,
            TeamAvailability = 100
        };

        // Act
        var result = await _service.EvaluateRiskAsync(request);

        // Assert
        var savedAssessment = await _context.RiskAssessments.FindAsync(result.AssessmentId);
        Assert.NotNull(savedAssessment);
        Assert.Equal(request.TeamId, savedAssessment.TeamId);
        Assert.Equal(request.PlannedCommitment, savedAssessment.PlannedCommitment);
    }

    [Fact]
    public async Task GetAssessmentHistoryAsync_ReturnsOrderedHistory()
    {
        // Arrange
        SetupMockMetrics(new SprintMetricsDto
        {
            AverageVelocity = 30,
            VelocityStandardDeviation = 3,
            VelocityCoefficient = 0.1m,
            EffectiveCapacity = 24,
            CVR = 1.0m,
            SpilloverRate = 10,
            SprintCount = 5,
            VelocityTrend = "stable",
            RecommendedCommitment = 24
        });

        // Create multiple assessments
        for (int i = 0; i < 3; i++)
        {
            await _service.EvaluateRiskAsync(new RiskAssessmentRequestDto
            {
                TeamId = 1,
                PlannedCommitment = 30 + i,
                TeamAvailability = 100
            });
            await Task.Delay(10); // Small delay to ensure different timestamps
        }

        // Act
        var history = await _service.GetAssessmentHistoryAsync(1);

        // Assert
        Assert.Equal(3, history.Count());
        var historyList = history.ToList();
        for (int i = 0; i < historyList.Count - 1; i++)
        {
            Assert.True(historyList[i].AssessedAt >= historyList[i + 1].AssessedAt);
        }
    }

    #endregion

    #region Helper Methods

    private void SetupMockMetrics(SprintMetricsDto metrics)
    {
        _mockMetricsService.Setup(m => m.CalculateMetrics(It.IsAny<IEnumerable<Sprint>>(), It.IsAny<int>()))
            .Returns(metrics);
    }

    #endregion
}
