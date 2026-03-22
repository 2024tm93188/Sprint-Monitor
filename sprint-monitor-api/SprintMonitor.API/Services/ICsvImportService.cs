using SprintMonitor.API.DTOs;

namespace SprintMonitor.API.Services;

public interface ICsvImportService
{
    Task<CsvImportResultDto> ImportSprintsFromCsvAsync(int teamId, Stream csvStream);
    Task<CsvImportResultDto> ImportSprintsFromCsvStringAsync(int teamId, string csvContent);
}
