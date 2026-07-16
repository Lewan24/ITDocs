using System.ComponentModel.DataAnnotations;

namespace ITDocsApi.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
}