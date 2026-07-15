using ITDocsApi.Domain.Entities;

namespace ITDocsApi.Domain.Dtos;

public record WarrantyItemDto(Guid Id, string Name, string Vendor, string SerialNumber, DateOnly PurchaseDate,
    DateOnly WarrantyEndDate, WarrantyType WarrantyType, string ContactName, string ContactPhone, string ContactEmail,
    string Notes, Guid? AssetId, bool Starred, WarrantyStatus Status,
    string? DocumentName, string? DocumentMimeType, long? DocumentSize);

public record CreateWarrantyItemDto(string Name, string Vendor, string SerialNumber, DateOnly PurchaseDate,
    DateOnly WarrantyEndDate, WarrantyType WarrantyType, string ContactName, string ContactPhone, string ContactEmail,
    string Notes, Guid? AssetId);

public record UpdateWarrantyItemDto(string Name, string Vendor, string SerialNumber, DateOnly PurchaseDate,
    DateOnly WarrantyEndDate, WarrantyType WarrantyType, string ContactName, string ContactPhone, string ContactEmail,
    string Notes, Guid? AssetId);