using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

/// <summary>
/// Response from the ML prediction service
/// </summary>
public class MlPredictionResult
{
    public RiskLevel MlRisk { get; set; }
    public decimal Confidence { get; set; }
    public Dictionary<string, decimal> Probabilities { get; set; } = new();
    public bool IsAvailable { get; set; } = true;
}

/// <summary>
/// Service interface for calling the ML risk prediction microservice
/// </summary>
public interface IMlRiskService
{
    /// <summary>
    /// Get ML risk prediction for the given sprint features.
    /// Returns a result with IsAvailable = false if the ML service is down.
    /// </summary>
    Task<MlPredictionResult> PredictRiskAsync(
        decimal cvr,
        int spillover,
        int dependencies,
        int teamAvailability,
        int committedPoints,
        int completedPoints,
        int teamSize,
        int meetingHoursPerSprint,
        int newMembersCount,
        int avgExperienceLevel,
        int collaborationScore);

    /// <summary>
    /// Combine rule-based and ML risk levels into a final risk level.
    /// Uses a conservative approach: the higher risk wins.
    /// </summary>
    RiskLevel CombineRiskLevels(RiskLevel ruleRisk, RiskLevel mlRisk, decimal mlConfidence);
}
