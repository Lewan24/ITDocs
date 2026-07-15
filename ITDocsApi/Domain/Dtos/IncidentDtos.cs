using ITDocsApi.Domain.Entities;

namespace ITDocsApi.Domain.Dtos;

public record IncidentDto(Guid Id, string Title, IncidentSeverity Severity, IncidentStatus Status, string Description,
    string Resolution, List<string> AffectedSystems, DateTime OccurredAt, DateTime? ResolvedAt, List<string> Tags);

public record CreateIncidentDto(string Title, IncidentSeverity Severity, IncidentStatus Status, string Description,
    string Resolution, List<string> AffectedSystems, DateTime OccurredAt, DateTime? ResolvedAt, List<string> Tags);

public record UpdateIncidentDto(string Title, IncidentSeverity Severity, IncidentStatus Status, string Description,
    string Resolution, List<string> AffectedSystems, DateTime OccurredAt, DateTime? ResolvedAt, List<string> Tags);