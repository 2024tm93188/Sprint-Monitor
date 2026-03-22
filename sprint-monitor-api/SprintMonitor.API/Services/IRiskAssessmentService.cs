using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

public interface IRiskAssessmentService
{
    Task<RiskAssessmentDto> EvaluateRiskAsync(RiskAssessmentRequestDto request);
    Task<IEnumerable<RiskAssessmentDto>> GetAssessmentHistoryAsync(int teamId);
    Task<RiskAssessmentDto?> GetAssessmentByIdAsync(int assessmentId);
    Task<RiskAssessmentDto?> UpdateAssessmentOutcomeAsync(int assessmentId, UpdateAssessmentOutcomeDto dto);
}
