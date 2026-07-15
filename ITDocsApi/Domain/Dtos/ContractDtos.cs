using ITDocsApi.Domain.Entities;

namespace ITDocsApi.Domain.Dtos;

public record ContractDto(Guid Id, string Name, string Vendor, ContractCategory Category, DateOnly StartDate,
    DateOnly EndDate, decimal Value, string Currency, bool AutoRenew, string Notes, bool Starred, ContractStatus Status);

public record CreateContractDto(string Name, string Vendor, ContractCategory Category, DateOnly StartDate,
    DateOnly EndDate, decimal Value, string Currency, bool AutoRenew, string Notes);

public record UpdateContractDto(string Name, string Vendor, ContractCategory Category, DateOnly StartDate,
    DateOnly EndDate, decimal Value, string Currency, bool AutoRenew, string Notes);