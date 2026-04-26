using System.Net.Http.Json;
using System.Text.Json;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

/// <summary>
/// Calls the Python FastAPI ML microservice for risk predictions.
/// Implements graceful fallback: if the ML service is down, the rule engine result is used alone.
/// </summary>
public class MlRiskService : IMlRiskService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MlRiskService> _logger;

    // Risk level numeric mapping for weighted combination
    private static readonly Dictionary<RiskLevel, int> RiskScoreMap = new()
    {
        { RiskLevel.LOW, 1 },
        { RiskLevel.MEDIUM, 2 },
        { RiskLevel.HIGH, 3 }
    };

    public MlRiskService(HttpClient httpClient, ILogger<MlRiskService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<MlPredictionResult> PredictRiskAsync(
        decimal cvr,
        int spillover,
        int dependencies,
        int teamAvailability,
        int committedPoints,
        int completedPoints,
        int teamSize)
    {
        try
        {
            var payload = new
            {
                cvr = (double)cvr,
                spillover,
                dependencies,
                teamAvailability,
                committedPoints,
                completedPoints,
                teamSize
            };

            var response = await _httpClient.PostAsJsonAsync("/predict", payload);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ML service returned {StatusCode}. Falling back to rule-only risk.",
                    response.StatusCode);
                return new MlPredictionResult { IsAvailable = false };
            }

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();

            var mlRiskStr = json.GetProperty("mlRisk").GetString() ?? "MEDIUM";
            var confidence = json.GetProperty("confidence").GetDecimal();

            var probabilities = new Dictionary<string, decimal>();
            if (json.TryGetProperty("probabilities", out var probsElement))
            {
                foreach (var prop in probsElement.EnumerateObject())
                {
                    probabilities[prop.Name] = prop.Value.GetDecimal();
                }
            }

            if (!Enum.TryParse<RiskLevel>(mlRiskStr, true, out var mlRisk))
            {
                mlRisk = RiskLevel.MEDIUM;
            }

            _logger.LogInformation(
                "ML prediction: {Risk} (confidence={Confidence:P2}) | CVR={CVR:F2}, Spillover={Spillover}, Deps={Deps}, Avail={Avail}%",
                mlRisk, confidence, cvr, spillover, dependencies, teamAvailability);

            return new MlPredictionResult
            {
                MlRisk = mlRisk,
                Confidence = confidence,
                Probabilities = probabilities,
                IsAvailable = true
            };
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "ML service unreachable. Falling back to rule-only risk.");
            return new MlPredictionResult { IsAvailable = false };
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "ML service timed out. Falling back to rule-only risk.");
            return new MlPredictionResult { IsAvailable = false };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling ML service. Falling back to rule-only risk.");
            return new MlPredictionResult { IsAvailable = false };
        }
    }

    /// <inheritdoc />
    public RiskLevel CombineRiskLevels(RiskLevel ruleRisk, RiskLevel mlRisk, decimal mlConfidence)
    {
        // If both agree, use the agreed level
        if (ruleRisk == mlRisk)
        {
            return ruleRisk;
        }

        // Conservative guardrail: if either model flags HIGH, final remains HIGH.
        if (ruleRisk == RiskLevel.HIGH || mlRisk == RiskLevel.HIGH)
        {
            return RiskLevel.HIGH;
        }

        // Weighted approach: 60% rule engine, 40% ML
        const decimal ruleWeight = 0.6m;
        const decimal mlWeight = 0.4m;

        var ruleScore = RiskScoreMap[ruleRisk];
        var mlScore = RiskScoreMap[mlRisk];

        var combinedScore = (ruleWeight * ruleScore) + (mlWeight * mlScore);

        // Conservative: round up when ambiguous
        if (combinedScore >= 2.5m)
            return RiskLevel.HIGH;
        if (combinedScore >= 1.5m)
            return RiskLevel.MEDIUM;

        return RiskLevel.LOW;
    }
}
