using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

/// <summary>
/// Service for importing sprint data from CSV files
/// </summary>
public class CsvImportService : ICsvImportService
{
    private readonly SprintMonitorDbContext _context;
    private readonly ISprintService _sprintService;

    public CsvImportService(SprintMonitorDbContext context, ISprintService sprintService)
    {
        _context = context;
        _sprintService = sprintService;
    }

    public async Task<CsvImportResultDto> ImportSprintsFromCsvAsync(int teamId, Stream csvStream)
    {
        using var reader = new StreamReader(csvStream);
        var content = await reader.ReadToEndAsync();
        return await ImportSprintsFromCsvStringAsync(teamId, content);
    }

    public async Task<CsvImportResultDto> ImportSprintsFromCsvStringAsync(int teamId, string csvContent)
    {
        var result = new CsvImportResultDto { Success = true };

        try
        {
            // Verify team exists
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                result.Success = false;
                result.Errors.Add($"Team with ID {teamId} not found.");
                return result;
            }

            // Parse CSV
            var lines = csvContent.Trim().Split('\n');
            if (lines.Length < 2)
            {
                result.Success = false;
                result.Errors.Add("CSV file must have a header row and at least one data row.");
                return result;
            }

            // Parse header to determine column mapping
            var header = lines[0].ToLower().Split(',').Select(h => h.Trim()).ToArray();
            var columnMap = MapColumns(header);

            // Process data rows
            for (int i = 1; i < lines.Length; i++)
            {
                var line = lines[i].Trim();
                if (string.IsNullOrWhiteSpace(line)) continue;

                try
                {
                    var values = line.Split(',').Select(v => v.Trim()).ToArray();
                    var sprint = ParseSprintFromCsv(teamId, values, columnMap, i + 1);
                    
                    if (sprint != null)
                    {
                        var createdSprint = await _sprintService.CreateSprintAsync(sprint);
                        result.ImportedSprints.Add(createdSprint);
                        result.ImportedCount++;
                    }
                    else
                    {
                        result.SkippedCount++;
                    }
                }
                catch (Exception ex)
                {
                    result.Errors.Add($"Row {i + 1}: {ex.Message}");
                    result.SkippedCount++;
                }
            }
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Errors.Add($"Failed to process CSV: {ex.Message}");
        }

        return result;
    }

    private Dictionary<string, int> MapColumns(string[] headers)
    {
        var map = new Dictionary<string, int>();

        for (int i = 0; i < headers.Length; i++)
        {
            var header = headers[i].ToLower().Replace(" ", "").Replace("_", "");
            
            // Map common variations
            if (header.Contains("sprint") && (header.Contains("name") || header.Contains("id") || header == "sprint"))
                map["sprintname"] = i;
            else if (header.Contains("committed") || header == "planned")
                map["committed"] = i;
            else if (header.Contains("completed") || header.Contains("done") || header.Contains("actual"))
                map["completed"] = i;
            else if (header.Contains("spillover") || header.Contains("carryover"))
                map["spillover"] = i;
            else if (header.Contains("added"))
                map["added"] = i;
            else if (header.Contains("removed"))
                map["removed"] = i;
            else if (header.Contains("availability"))
                map["availability"] = i;
            else if (header.Contains("teamsize") || header.Contains("size"))
                map["teamsize"] = i;
            else if (header.Contains("duration") || header.Contains("days"))
                map["duration"] = i;
            else if (header.Contains("start"))
                map["startdate"] = i;
            else if (header.Contains("end"))
                map["enddate"] = i;
            else if (header.Contains("dependencies") || header.Contains("external"))
                map["dependencies"] = i;
        }

        return map;
    }

    private CreateSprintDto? ParseSprintFromCsv(int teamId, string[] values, Dictionary<string, int> columnMap, int rowNumber)
    {
        // Required fields
        if (!columnMap.ContainsKey("committed") || !columnMap.ContainsKey("completed"))
        {
            throw new Exception("CSV must contain 'Committed' and 'Completed' columns.");
        }

        var sprint = new CreateSprintDto
        {
            TeamId = teamId,
            SprintName = GetValue(values, columnMap, "sprintname", $"Sprint {rowNumber}"),
            CommittedPoints = int.Parse(GetValue(values, columnMap, "committed", "0")),
            CompletedPoints = int.Parse(GetValue(values, columnMap, "completed", "0")),
            AddedPoints = int.Parse(GetValue(values, columnMap, "added", "0")),
            RemovedPoints = int.Parse(GetValue(values, columnMap, "removed", "0")),
            TeamAvailability = int.Parse(GetValue(values, columnMap, "availability", "100")),
            TeamSize = int.Parse(GetValue(values, columnMap, "teamsize", "5")),
            SprintDuration = int.Parse(GetValue(values, columnMap, "duration", "14")),
            ExternalDependencies = int.Parse(GetValue(values, columnMap, "dependencies", "0"))
        };

        // Parse spillover (could be "true"/"false" or "yes"/"no")
        var spilloverValue = GetValue(values, columnMap, "spillover", "").ToLower();
        sprint.HadSpillover = spilloverValue == "true" || spilloverValue == "yes" || spilloverValue == "1";

        // If spillover not explicitly set, calculate from points
        if (string.IsNullOrEmpty(spilloverValue))
        {
            sprint.HadSpillover = sprint.CommittedPoints + sprint.AddedPoints - sprint.RemovedPoints > sprint.CompletedPoints;
        }

        // Parse dates if present
        var startDateStr = GetValue(values, columnMap, "startdate", "");
        var endDateStr = GetValue(values, columnMap, "enddate", "");

        if (!string.IsNullOrEmpty(startDateStr) && DateTime.TryParse(startDateStr, out var startDate))
            sprint.StartDate = startDate;

        if (!string.IsNullOrEmpty(endDateStr) && DateTime.TryParse(endDateStr, out var endDate))
            sprint.EndDate = endDate;

        return sprint;
    }

    private string GetValue(string[] values, Dictionary<string, int> columnMap, string key, string defaultValue)
    {
        if (columnMap.TryGetValue(key, out int index) && index < values.Length)
        {
            var value = values[index].Trim();
            return string.IsNullOrEmpty(value) ? defaultValue : value;
        }
        return defaultValue;
    }
}
