namespace SprintMonitor.API.DTOs;

/// <summary>
/// DTO for creating a new sprint
/// </summary>
public class CreateSprintDto
{
    public int TeamId { get; set; }
    public string SprintName { get; set; } = string.Empty;
    public int CommittedPoints { get; set; }
    public int CompletedPoints { get; set; }
    public int AddedPoints { get; set; } = 0;
    public int RemovedPoints { get; set; } = 0;
    public int TeamAvailability { get; set; } = 100;
    public int TeamSize { get; set; } = 5;
    public int SprintDuration { get; set; } = 14;
    public bool HadSpillover { get; set; }
    public int ExternalDependencies { get; set; } = 0;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

/// <summary>
/// DTO for sprint response
/// </summary>
public class SprintDto
{
    public int SprintId { get; set; }
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string SprintName { get; set; } = string.Empty;
    public int CommittedPoints { get; set; }
    public int CompletedPoints { get; set; }
    public int AddedPoints { get; set; }
    public int RemovedPoints { get; set; }
    public int TeamAvailability { get; set; }
    public int TeamSize { get; set; }
    public int SprintDuration { get; set; }
    public bool HadSpillover { get; set; }
    public int ExternalDependencies { get; set; }
    public int SpilloverPoints { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for updating a sprint
/// </summary>
public class UpdateSprintDto
{
    public string? SprintName { get; set; }
    public int? CommittedPoints { get; set; }
    public int? CompletedPoints { get; set; }
    public int? AddedPoints { get; set; }
    public int? RemovedPoints { get; set; }
    public int? TeamAvailability { get; set; }
    public int? TeamSize { get; set; }
    public bool? HadSpillover { get; set; }
    public int? ExternalDependencies { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

/// <summary>
/// DTO for CSV import result
/// </summary>
public class CsvImportResultDto
{
    public bool Success { get; set; }
    public int ImportedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<SprintDto> ImportedSprints { get; set; } = new();
}
