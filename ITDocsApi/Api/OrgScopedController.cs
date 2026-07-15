using ITDocsApi.Domain.Entities;
using ITDocsApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITDocsApi.Api;

[Authorize]
public abstract class OrgScopedController(AppDbContext db, ICurrentUserContext userContext) : ControllerBase
{
    protected AppDbContext Db => db;

    // For GET endpoints given an explicit ?organizationId= — confirms membership before filtering
    protected async Task<ActionResult?> CheckReadAccessAsync(Guid organizationId) =>
        await userContext.HasAccessAsync(organizationId) ? null : Forbid();

    // For POST/PUT/DELETE/PATCH — confirms membership AND sufficient role
    protected async Task<ActionResult?> CheckWriteAccessAsync(Guid organizationId, OrgRole minRole = OrgRole.Member)
    {
        var role = await userContext.GetRoleAsync(organizationId);
        if (role is null) return Forbid();
        if (role < minRole) return Forbid();
        return null;
    }
}