using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

public interface IRiskAssessmentService
{
    Task<RiskAssessmentDto> EvaluateRiskAsync(RiskAssessmentRequestDto request);
    Task<IEnumerable<RiskAssessmentDto>> GetAssessmentHistoryAsync(int teamId);
    Task<IEnumerable<RiskAssessmentDto>> GetFinalAssessmentsAsync(int teamId);
    Task<RiskAssessmentDto?> GetAssessmentByIdAsync(int assessmentId);
    Task<RiskAssessmentDto?> MarkAssessmentAsFinalAsync(int assessmentId);
    Task<RecommendationDto?> ApplyRecommendationAsync(int recommendationId, ApplyRecommendationDto dto);
    Task<RecommendationDto?> ApplyRecommendationByMatchAsync(ApplyRecommendationByMatchDto dto);
}
