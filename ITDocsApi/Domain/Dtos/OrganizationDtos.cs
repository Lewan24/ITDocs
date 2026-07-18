namespace ITDocsApi.Domain.Dtos;

public record OrganizationDto(Guid Id, string Name, string Color, string Initials, string Description);
public record CreateOrganizationDto(string Name, string Color, string Initials, string Description);
public record UpdateOrganizationDto(string Name, string Color, string Initials, string Description);