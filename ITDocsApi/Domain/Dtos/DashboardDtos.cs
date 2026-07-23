namespace ITDocsApi.Domain.Dtos;

public record DashboardLayoutDto(List<string> SectionOrder, List<string> HiddenSections);