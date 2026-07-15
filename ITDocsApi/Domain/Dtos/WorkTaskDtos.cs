using ITDocsApi.Domain.Entities;

namespace ITDocsApi.Domain.Dtos;

public record WorkTaskDto(Guid Id, string Title, string Description, Priority Priority, WorkTaskStatus Status, string Assignee, DateOnly DueDate, List<string> Tags, DateTime CreatedAt);
public record CreateWorkTaskDto(string Title, string Description, Priority Priority, WorkTaskStatus Status, string Assignee, DateOnly DueDate, List<string> Tags);
public record UpdateWorkTaskDto(string Title, string Description, Priority Priority, WorkTaskStatus Status, string Assignee, DateOnly DueDate, List<string> Tags);