using AutoMapper;
using AutoMapper.QueryableExtensions;
using ITDocsApi.Domain.Dtos;
using ITDocsApi.Domain.Entities;
using ITDocsApi.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITDocsApi.Api;

[ApiController]
[Route("api/organizations")]
public class OrganizationsController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    private readonly ICurrentUserContext _userContext = userContext;

    [HttpGet]
    public async Task<ActionResult<List<OrganizationSummaryDto>>> GetAll()
    {
        var orgs = await Db.UserOrganizations
            .Where(uo => uo.UserId == _userContext.UserId)
            .Select(uo => new OrganizationSummaryDto(uo.OrganizationId, uo.Organization.Name, uo.Role.ToString()))
            .ToListAsync();
        return Ok(orgs);
    }

    [HttpGet("deleted")]
    public async Task<ActionResult<List<OrganizationSummaryDto>>> GetDeleted()
    {
        var orgs = await Db.UserOrganizations.IgnoreQueryFilters()
            .Where(uo => uo.UserId == _userContext.UserId && uo.Role == OrgRole.Owner && uo.Organization.IsDeleted)
            .Select(uo => new OrganizationSummaryDto(uo.OrganizationId, uo.Organization.Name, uo.Role.ToString()))
            .ToListAsync();
        return Ok(orgs);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrganizationDto>> GetById(Guid id)
    {
        var check = await CheckReadAccessAsync(id);
        if (check is not null) return check;

        var org = await Db.Organizations.FirstOrDefaultAsync(o => o.Id == id);
        return org is null ? NotFound() : Ok(mapper.Map<OrganizationDto>(org));
    }

    [HttpPost]
    public async Task<ActionResult<OrganizationDto>> Create(CreateOrganizationDto dto)
    {
        var org = mapper.Map<Organization>(dto);
        Db.Organizations.Add(org);
        Db.UserOrganizations.Add(new UserOrganization { UserId = _userContext.UserId, OrganizationId = org.Id, Role = OrgRole.Owner });
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = org.Id }, mapper.Map<OrganizationDto>(org));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateOrganizationDto dto)
    {
        var check = await CheckWriteAccessAsync(id, OrgRole.Admin);
        if (check is not null) return check;

        var org = await Db.Organizations.FirstOrDefaultAsync(o => o.Id == id);
        if (org is null) return NotFound();

        mapper.Map(dto, org);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    // ── Members ──

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<List<OrgMemberDto>>> GetMembers(Guid id)
    {
        var check = await CheckReadAccessAsync(id);
        if (check is not null) return check;

        var members = await Db.UserOrganizations
            .Where(uo => uo.OrganizationId == id)
            .Select(uo => new OrgMemberDto(uo.UserId, uo.User.Email, uo.User.DisplayName, uo.Role))
            .ToListAsync();
        return Ok(members);
    }

    // Only registered users can be invited — this looks them up by email
    // rather than sending a signup link. Role is capped below Owner: an org
    // can only ever have the one Owner it was created with.
    [HttpPost("{id:guid}/members")]
    public async Task<ActionResult<OrgMemberDto>> InviteMember(Guid id, InviteMemberDto dto)
    {
        var check = await CheckWriteAccessAsync(id, OrgRole.Admin);
        if (check is not null) return check;

        if (dto.Role == OrgRole.Owner)
            return BadRequest("An organization can only have one owner. Invite as Admin or another role instead.");

        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await Db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
            return NotFound("No registered user with that email address was found.");

        var alreadyMember = await Db.UserOrganizations.AnyAsync(uo => uo.OrganizationId == id && uo.UserId == user.Id);
        if (alreadyMember)
            return Conflict("This user is already a member of the organization.");

        Db.UserOrganizations.Add(new UserOrganization { UserId = user.Id, OrganizationId = id, Role = dto.Role });
        await Db.SaveChangesAsync();

        return Ok(new OrgMemberDto(user.Id, user.Email, user.DisplayName, dto.Role));
    }

    // Handles both "leaving" (isSelf) and an Admin/Owner removing someone else.
    // The Owner can never be removed via this endpoint — self or otherwise.
    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var isSelf = userId == _userContext.UserId;
        var check = isSelf
            ? await CheckReadAccessAsync(id)
            : await CheckWriteAccessAsync(id, OrgRole.Admin);
        if (check is not null) return check;

        var membership = await Db.UserOrganizations.FirstOrDefaultAsync(uo => uo.OrganizationId == id && uo.UserId == userId);
        if (membership is null) return NotFound();

        if (membership.Role == OrgRole.Owner)
            return BadRequest(isSelf
                ? "The organization owner cannot leave. Delete the organization instead if you want to give it up."
                : "The organization owner cannot be removed.");

        // An Admin can't remove another Admin — only the Owner outranks Admins.
        if (!isSelf)
        {
            var actingRole = await _userContext.GetRoleAsync(id);
            if (actingRole != OrgRole.Owner && membership.Role >= OrgRole.Admin)
                return Forbid();
        }

        Db.UserOrganizations.Remove(membership);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    // ── Soft delete / restore ──

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var check = await CheckWriteAccessAsync(id, OrgRole.Owner);
        if (check is not null) return check;

        var org = await Db.Organizations.FirstOrDefaultAsync(o => o.Id == id);
        if (org is null) return NotFound();

        org.IsDeleted = true;
        org.DeletedAt = DateTime.UtcNow;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id)
    {
        // Organization's global filter hides soft-deleted rows — bypass it here
        // so a deleted org can actually be found and restored.
        var org = await Db.Organizations.IgnoreQueryFilters().FirstOrDefaultAsync(o => o.Id == id);
        if (org is null) return NotFound();
        if (!org.IsDeleted) return BadRequest("Organization is not deleted.");

        var role = await Db.UserOrganizations
            .Where(uo => uo.OrganizationId == id && uo.UserId == _userContext.UserId)
            .Select(uo => (OrgRole?)uo.Role)
            .FirstOrDefaultAsync();
        if (role != OrgRole.Owner) return Forbid();

        org.IsDeleted = false;
        org.DeletedAt = null;
        await Db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── AssetsController ───────────────────────────────────────────────────────
[ApiController]
[Route("api/assets")]
public class AssetsController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    // No organizationId -> assets from every org the caller belongs to (global filter already restricts this)
    // organizationId given -> scoped to that one org, after an explicit access check
    [HttpGet]
    public async Task<ActionResult<List<AssetDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Assets.AsQueryable();
        if (organizationId is { } id) query = query.Where(a => a.OrganizationId == id);

        return Ok(await query.ProjectTo<AssetDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssetDto>> GetById(Guid id)
    {
        var asset = await Db.Assets.FirstOrDefaultAsync(a => a.Id == id);
        return asset is null ? NotFound() : Ok(mapper.Map<AssetDto>(asset)); // filter already hides inaccessible rows
    }

    [HttpPost]
    public async Task<ActionResult<AssetDto>> Create([FromQuery] Guid organizationId, CreateAssetDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var asset = mapper.Map<Asset>(dto);
        asset.OrganizationId = organizationId;
        asset.UpdatedAt = DateTime.UtcNow;
        Db.Assets.Add(asset);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = asset.Id }, mapper.Map<AssetDto>(asset));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateAssetDto dto)
    {
        var asset = await Db.Assets.FirstOrDefaultAsync(a => a.Id == id);
        if (asset is null) return NotFound();

        var check = await CheckWriteAccessAsync(asset.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, asset);
        asset.UpdatedAt = DateTime.UtcNow;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var asset = await Db.Assets.FirstOrDefaultAsync(a => a.Id == id);
        if (asset is null) return NotFound();

        var check = await CheckWriteAccessAsync(asset.OrganizationId);
        if (check is not null) return check;

        Db.Assets.Remove(asset);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var asset = await Db.Assets.FirstOrDefaultAsync(a => a.Id == id);
        if (asset is null) return NotFound();

        var check = await CheckWriteAccessAsync(asset.OrganizationId);
        if (check is not null) return check;

        asset.Starred = !asset.Starred;
        await Db.SaveChangesAsync();
        return Ok(new { asset.Starred });
    }
}

// ─── PasswordsController ────────────────────────────────────────────────────
[ApiController]
[Route("api/passwords")]
public class PasswordsController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext, IPasswordCipher cipher)
    : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<PasswordListDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Passwords.AsQueryable();
        if (organizationId is { } id) query = query.Where(p => p.OrganizationId == id);

        return Ok(await query.ProjectTo<PasswordListDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}/reveal")]
    public async Task<ActionResult<string>> Reveal(Guid id)
    {
        var entry = await Db.Passwords.FirstOrDefaultAsync(p => p.Id == id);
        if (entry is null) return NotFound();
        // TODO: audit log entry — who revealed what, when
        return Ok(cipher.Decrypt(entry.EncryptedPassword));
    }

    [HttpPost]
    public async Task<ActionResult<PasswordListDto>> Create([FromQuery] Guid organizationId, CreatePasswordDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var entry = mapper.Map<PasswordEntry>(dto);
        entry.OrganizationId = organizationId;
        entry.EncryptedPassword = cipher.Encrypt(dto.Password);
        entry.Strength = CalcStrength(dto.Password);
        entry.UpdatedAt = DateTime.UtcNow;
        Db.Passwords.Add(entry);
        await Db.SaveChangesAsync();
        return Ok(mapper.Map<PasswordListDto>(entry));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdatePasswordDto dto)
    {
        var entry = await Db.Passwords.FirstOrDefaultAsync(p => p.Id == id);
        if (entry is null) return NotFound();

        var check = await CheckWriteAccessAsync(entry.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, entry);
        if (!string.IsNullOrEmpty(dto.Password))
        {
            entry.EncryptedPassword = cipher.Encrypt(dto.Password);
            entry.Strength = CalcStrength(dto.Password);
        }
        entry.UpdatedAt = DateTime.UtcNow;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entry = await Db.Passwords.FirstOrDefaultAsync(p => p.Id == id);
        if (entry is null) return NotFound();

        var check = await CheckWriteAccessAsync(entry.OrganizationId);
        if (check is not null) return check;

        Db.Passwords.Remove(entry);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var entry = await Db.Passwords.FirstOrDefaultAsync(p => p.Id == id);
        if (entry is null) return NotFound();

        var check = await CheckWriteAccessAsync(entry.OrganizationId);
        if (check is not null) return check;

        entry.Starred = !entry.Starred;
        await Db.SaveChangesAsync();
        return Ok(new { entry.Starred });
    }

    private static PasswordStrength CalcStrength(string pw) =>
        pw.Length >= 16 && pw.Any(char.IsUpper) && pw.Any(char.IsDigit) && pw.Any(c => !char.IsLetterOrDigit(c))
            ? PasswordStrength.Strong
            : pw.Length >= 10 ? PasswordStrength.Medium : PasswordStrength.Weak;
}

public interface IPasswordCipher
{
    byte[] Encrypt(string plaintext);
    string Decrypt(byte[] ciphertext);
}

// ─── SubnetsController ──────────────────────────────────────────────────────
[ApiController]
[Route("api/subnets")]
public class SubnetsController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<SubnetDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Subnets.Include(s => s.Ips).AsQueryable();
        if (organizationId is { } id) query = query.Where(s => s.OrganizationId == id);

        return Ok(await query.ProjectTo<SubnetDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubnetDto>> GetById(Guid id)
    {
        var subnet = await Db.Subnets.Include(s => s.Ips).FirstOrDefaultAsync(s => s.Id == id);
        return subnet is null ? NotFound() : Ok(mapper.Map<SubnetDto>(subnet));
    }

    [HttpPost]
    public async Task<ActionResult<SubnetDto>> Create([FromQuery] Guid organizationId, CreateSubnetDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var subnet = mapper.Map<Subnet>(dto);
        subnet.OrganizationId = organizationId;
        Db.Subnets.Add(subnet);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = subnet.Id }, mapper.Map<SubnetDto>(subnet));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSubnetDto dto)
    {
        var subnet = await Db.Subnets.FirstOrDefaultAsync(s => s.Id == id);
        if (subnet is null) return NotFound();

        var check = await CheckWriteAccessAsync(subnet.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, subnet);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var subnet = await Db.Subnets.FirstOrDefaultAsync(s => s.Id == id);
        if (subnet is null) return NotFound();

        var check = await CheckWriteAccessAsync(subnet.OrganizationId);
        if (check is not null) return check;

        Db.Subnets.Remove(subnet);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{subnetId:guid}/ips")]
    public async Task<ActionResult<IPEntryDto>> AddIp(Guid subnetId, CreateIPEntryDto dto)
    {
        var subnet = await Db.Subnets.FirstOrDefaultAsync(s => s.Id == subnetId);
        if (subnet is null) return NotFound();

        var check = await CheckWriteAccessAsync(subnet.OrganizationId);
        if (check is not null) return check;

        var entry = mapper.Map<IPEntry>(dto);
        entry.SubnetId = subnetId;
        Db.IPEntries.Add(entry);
        await Db.SaveChangesAsync();
        return Ok(mapper.Map<IPEntryDto>(entry));
    }

    [HttpPut("{subnetId:guid}/ips/{entryId:guid}")]
    public async Task<IActionResult> UpdateIp(Guid subnetId, Guid entryId, UpdateIPEntryDto dto)
    {
        var subnet = await Db.Subnets.FirstOrDefaultAsync(s => s.Id == subnetId);
        if (subnet is null) return NotFound();

        var check = await CheckWriteAccessAsync(subnet.OrganizationId);
        if (check is not null) return check;

        var entry = await Db.IPEntries.FirstOrDefaultAsync(ip => ip.Id == entryId && ip.SubnetId == subnetId);
        if (entry is null) return NotFound();

        mapper.Map(dto, entry);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{subnetId:guid}/ips/{entryId:guid}")]
    public async Task<IActionResult> DeleteIp(Guid subnetId, Guid entryId)
    {
        var subnet = await Db.Subnets.FirstOrDefaultAsync(s => s.Id == subnetId);
        if (subnet is null) return NotFound();

        var check = await CheckWriteAccessAsync(subnet.OrganizationId);
        if (check is not null) return check;

        var entry = await Db.IPEntries.FirstOrDefaultAsync(ip => ip.Id == entryId && ip.SubnetId == subnetId);
        if (entry is null) return NotFound();

        Db.IPEntries.Remove(entry);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── LicensesController ─────────────────────────────────────────────────────
[ApiController]
[Route("api/licenses")]
public class LicensesController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<LicenseDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Licenses.AsQueryable();
        if (organizationId is { } id) query = query.Where(l => l.OrganizationId == id);

        return Ok(await query.ProjectTo<LicenseDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LicenseDto>> GetById(Guid id)
    {
        var license = await Db.Licenses.FirstOrDefaultAsync(l => l.Id == id);
        return license is null ? NotFound() : Ok(mapper.Map<LicenseDto>(license));
    }

    [HttpPost]
    public async Task<ActionResult<LicenseDto>> Create([FromQuery] Guid organizationId, CreateLicenseDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var license = mapper.Map<License>(dto);
        license.OrganizationId = organizationId;
        license.Status = CalcStatus(license.ExpiryDate);
        Db.Licenses.Add(license);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = license.Id }, mapper.Map<LicenseDto>(license));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateLicenseDto dto)
    {
        var license = await Db.Licenses.FirstOrDefaultAsync(l => l.Id == id);
        if (license is null) return NotFound();

        var check = await CheckWriteAccessAsync(license.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, license);
        license.Status = CalcStatus(license.ExpiryDate);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var license = await Db.Licenses.FirstOrDefaultAsync(l => l.Id == id);
        if (license is null) return NotFound();

        var check = await CheckWriteAccessAsync(license.OrganizationId);
        if (check is not null) return check;

        Db.Licenses.Remove(license);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var license = await Db.Licenses.FirstOrDefaultAsync(l => l.Id == id);
        if (license is null) return NotFound();

        var check = await CheckWriteAccessAsync(license.OrganizationId);
        if (check is not null) return check;

        license.Starred = !license.Starred;
        await Db.SaveChangesAsync();
        return Ok(new { license.Starred });
    }

    private static LicenseStatus CalcStatus(DateOnly expiry)
    {
        var days = expiry.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
        return days < 0 ? LicenseStatus.Expired : days <= 60 ? LicenseStatus.Expiring : LicenseStatus.Active;
    }
}

// ─── ContactsController ─────────────────────────────────────────────────────
[ApiController]
[Route("api/contacts")]
public class ContactsController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<ContactDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Contacts.AsQueryable();
        if (organizationId is { } id) query = query.Where(c => c.OrganizationId == id);

        return Ok(await query.ProjectTo<ContactDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContactDto>> GetById(Guid id)
    {
        var contact = await Db.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        return contact is null ? NotFound() : Ok(mapper.Map<ContactDto>(contact));
    }

    [HttpPost]
    public async Task<ActionResult<ContactDto>> Create([FromQuery] Guid organizationId, CreateContactDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var contact = mapper.Map<Contact>(dto);
        contact.OrganizationId = organizationId;
        Db.Contacts.Add(contact);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = contact.Id }, mapper.Map<ContactDto>(contact));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateContactDto dto)
    {
        var contact = await Db.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        if (contact is null) return NotFound();

        var check = await CheckWriteAccessAsync(contact.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, contact);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var contact = await Db.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        if (contact is null) return NotFound();

        var check = await CheckWriteAccessAsync(contact.OrganizationId);
        if (check is not null) return check;

        Db.Contacts.Remove(contact);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var contact = await Db.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        if (contact is null) return NotFound();

        var check = await CheckWriteAccessAsync(contact.OrganizationId);
        if (check is not null) return check;

        contact.Starred = !contact.Starred;
        await Db.SaveChangesAsync();
        return Ok(new { contact.Starred });
    }
}

// ─── ContractsController ────────────────────────────────────────────────────
[ApiController]
[Route("api/contracts")]
public class ContractsController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext, IFileStorage storage) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<ContractDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Contracts.AsQueryable();
        if (organizationId is { } id) query = query.Where(c => c.OrganizationId == id);

        return Ok(await query
            .Select(c => new ContractDto(
                c.Id,
                c.Name,
                c.Vendor,
                c.Category,
                c.StartDate,
                c.EndDate,
                c.Value,
                c.Currency,
                c.AutoRenew,
                c.Notes,
                c.Starred,
                c.Status,
                c.DocumentName == null
                    ? null
                    : new ContractDocumentDto(
                        c.DocumentName,
                        c.DocumentMimeType ?? "",
                        c.DocumentSize ?? 0
                    )
            ))
            .ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContractDto>> GetById(Guid id)
    {
        var contract = await Db.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        return contract is null ? NotFound() : Ok(mapper.Map<ContractDto>(contract));
    }

    [HttpPost]
    public async Task<ActionResult<ContractDto>> Create([FromQuery] Guid organizationId, CreateContractDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var contract = mapper.Map<Contract>(dto);
        contract.OrganizationId = organizationId;
        contract.Status = CalcStatus(contract.EndDate);
        Db.Contracts.Add(contract);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = contract.Id }, mapper.Map<ContractDto>(contract));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateContractDto dto)
    {
        var contract = await Db.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract is null) return NotFound();

        var check = await CheckWriteAccessAsync(contract.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, contract);
        contract.Status = CalcStatus(contract.EndDate);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var contract = await Db.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract is null) return NotFound();

        var check = await CheckWriteAccessAsync(contract.OrganizationId);
        if (check is not null) return check;

        Db.Contracts.Remove(contract);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var contract = await Db.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract is null) return NotFound();

        var check = await CheckWriteAccessAsync(contract.OrganizationId);
        if (check is not null) return check;

        contract.Starred = !contract.Starred;
        await Db.SaveChangesAsync();
        return Ok(new { contract.Starred });
    }
    
    [HttpPost("{id:guid}/document")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadDocument(Guid id, IFormFile file)
    {
        var contract = await Db.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract is null) return NotFound();

        var check = await CheckWriteAccessAsync(contract.OrganizationId);
        if (check is not null) return check;

        if (contract.DocumentBlobPath is not null) await storage.DeleteAsync(contract.DocumentBlobPath);

        var path = await storage.SaveAsync(file.OpenReadStream(), file.FileName, file.ContentType);
        contract.DocumentName = file.FileName;
        contract.DocumentMimeType = file.ContentType;
        contract.DocumentSize = file.Length;
        contract.DocumentBlobPath = path;
        await Db.SaveChangesAsync();
        return Ok(mapper.Map<ContractDto>(contract));
    }

    [HttpGet("{id:guid}/document")]
    public async Task<IActionResult> DownloadDocument(Guid id)
    {
        var contract = await Db.Contracts.FirstOrDefaultAsync(c => c.Id == id);
        if (contract?.DocumentBlobPath is null) return NotFound();

        var stream = await storage.OpenAsync(contract.DocumentBlobPath);
        return File(stream, contract.DocumentMimeType ?? "application/octet-stream", contract.DocumentName);
    }

    private static ContractStatus CalcStatus(DateOnly end)
    {
        var days = end.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
        return days < 0 ? ContractStatus.Expired : days <= 60 ? ContractStatus.Expiring : ContractStatus.Active;
    }
}

// ─── PlansController ────────────────────────────────────────────────────────
[ApiController]
[Route("api/plans")]
public class PlansController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<PlanDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Plans.AsQueryable();
        if (organizationId is { } id) query = query.Where(p => p.OrganizationId == id);

        return Ok(await query.ProjectTo<PlanDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlanDto>> GetById(Guid id)
    {
        var plan = await Db.Plans.FirstOrDefaultAsync(p => p.Id == id);
        return plan is null ? NotFound() : Ok(mapper.Map<PlanDto>(plan));
    }

    [HttpPost]
    public async Task<ActionResult<PlanDto>> Create([FromQuery] Guid organizationId, CreatePlanDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var plan = mapper.Map<Plan>(dto);
        plan.OrganizationId = organizationId;
        plan.CreatedAt = DateTime.UtcNow;
        Db.Plans.Add(plan);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, mapper.Map<PlanDto>(plan));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdatePlanDto dto)
    {
        var plan = await Db.Plans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null) return NotFound();

        var check = await CheckWriteAccessAsync(plan.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, plan);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var plan = await Db.Plans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null) return NotFound();

        var check = await CheckWriteAccessAsync(plan.OrganizationId);
        if (check is not null) return check;

        Db.Plans.Remove(plan);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── IncidentsController ────────────────────────────────────────────────────
[ApiController]
[Route("api/incidents")]
public class IncidentsController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<IncidentDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Incidents.AsQueryable();
        if (organizationId is { } id) query = query.Where(i => i.OrganizationId == id);

        return Ok(await query.ProjectTo<IncidentDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<IncidentDto>> GetById(Guid id)
    {
        var incident = await Db.Incidents.FirstOrDefaultAsync(i => i.Id == id);
        return incident is null ? NotFound() : Ok(mapper.Map<IncidentDto>(incident));
    }

    [HttpPost]
    public async Task<ActionResult<IncidentDto>> Create([FromQuery] Guid organizationId, CreateIncidentDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var incident = mapper.Map<Incident>(dto);
        incident.OrganizationId = organizationId;
        Db.Incidents.Add(incident);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = incident.Id }, mapper.Map<IncidentDto>(incident));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateIncidentDto dto)
    {
        var incident = await Db.Incidents.FirstOrDefaultAsync(i => i.Id == id);
        if (incident is null) return NotFound();

        var check = await CheckWriteAccessAsync(incident.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, incident);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var incident = await Db.Incidents.FirstOrDefaultAsync(i => i.Id == id);
        if (incident is null) return NotFound();

        var check = await CheckWriteAccessAsync(incident.OrganizationId);
        if (check is not null) return check;

        Db.Incidents.Remove(incident);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── KnowledgeController ────────────────────────────────────────────────────
[ApiController]
[Route("api/knowledge")]
public class KnowledgeController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<KnowledgeArticleDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.KnowledgeArticles.AsQueryable();
        if (organizationId is { } id) query = query.Where(a => a.OrganizationId == id);

        return Ok(await query.ProjectTo<KnowledgeArticleDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<KnowledgeArticleDto>> GetById(Guid id)
    {
        var article = await Db.KnowledgeArticles.FirstOrDefaultAsync(a => a.Id == id);
        return article is null ? NotFound() : Ok(mapper.Map<KnowledgeArticleDto>(article));
    }

    [HttpPost]
    public async Task<ActionResult<KnowledgeArticleDto>> Create([FromQuery] Guid organizationId, CreateKnowledgeArticleDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var article = mapper.Map<KnowledgeArticle>(dto);
        article.OrganizationId = organizationId;
        article.UpdatedAt = DateTime.UtcNow;
        Db.KnowledgeArticles.Add(article);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = article.Id }, mapper.Map<KnowledgeArticleDto>(article));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateKnowledgeArticleDto dto)
    {
        var article = await Db.KnowledgeArticles.FirstOrDefaultAsync(a => a.Id == id);
        if (article is null) return NotFound();

        var check = await CheckWriteAccessAsync(article.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, article);
        article.UpdatedAt = DateTime.UtcNow;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var article = await Db.KnowledgeArticles.FirstOrDefaultAsync(a => a.Id == id);
        if (article is null) return NotFound();

        var check = await CheckWriteAccessAsync(article.OrganizationId);
        if (check is not null) return check;

        Db.KnowledgeArticles.Remove(article);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var article = await Db.KnowledgeArticles.FirstOrDefaultAsync(a => a.Id == id);
        if (article is null) return NotFound();

        var check = await CheckWriteAccessAsync(article.OrganizationId);
        if (check is not null) return check;

        article.Starred = !article.Starred;
        await Db.SaveChangesAsync();
        return Ok(new { article.Starred });
    }
}

// ─── TasksController ────────────────────────────────────────────────────────
[ApiController]
[Route("api/tasks")]
public class TasksController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<WorkTaskDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Tasks.AsQueryable();
        if (organizationId is { } id) query = query.Where(t => t.OrganizationId == id);

        return Ok(await query.ProjectTo<WorkTaskDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkTaskDto>> GetById(Guid id)
    {
        var task = await Db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        return task is null ? NotFound() : Ok(mapper.Map<WorkTaskDto>(task));
    }

    [HttpPost]
    public async Task<ActionResult<WorkTaskDto>> Create([FromQuery] Guid organizationId, CreateWorkTaskDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var task = mapper.Map<WorkTask>(dto);
        task.OrganizationId = organizationId;
        task.CreatedAt = DateTime.UtcNow;
        Db.Tasks.Add(task);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, mapper.Map<WorkTaskDto>(task));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateWorkTaskDto dto)
    {
        var task = await Db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return NotFound();

        var check = await CheckWriteAccessAsync(task.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, task);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await Db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return NotFound();

        var check = await CheckWriteAccessAsync(task.OrganizationId);
        if (check is not null) return check;

        Db.Tasks.Remove(task);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── GroupsController ───────────────────────────────────────────────────────
[ApiController]
[Route("api/groups")]
public class GroupsController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<GroupDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.Groups.AsQueryable();
        if (organizationId is { } id) query = query.Where(g => g.OrganizationId == id);

        return Ok(await query.ProjectTo<GroupDto>(mapper.ConfigurationProvider).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupDto>> GetById(Guid id)
    {
        var group = await Db.Groups.FirstOrDefaultAsync(g => g.Id == id);
        return group is null ? NotFound() : Ok(mapper.Map<GroupDto>(group));
    }

    [HttpPost]
    public async Task<ActionResult<GroupDto>> Create([FromQuery] Guid organizationId, CreateGroupDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var group = mapper.Map<Group>(dto);
        group.OrganizationId = organizationId;
        group.CreatedAt = DateTime.UtcNow;
        Db.Groups.Add(group);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = group.Id }, mapper.Map<GroupDto>(group));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateGroupDto dto)
    {
        var group = await Db.Groups.FirstOrDefaultAsync(g => g.Id == id);
        if (group is null) return NotFound();

        var check = await CheckWriteAccessAsync(group.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, group);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var group = await Db.Groups.FirstOrDefaultAsync(g => g.Id == id);
        if (group is null) return NotFound();

        var check = await CheckWriteAccessAsync(group.OrganizationId);
        if (check is not null) return check;

        Db.Groups.Remove(group);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── WarrantiesController ───────────────────────────────────────────────────
[ApiController]
[Route("api/warranties")]
public class WarrantiesController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext, IFileStorage storage)
    : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<List<WarrantyItemDto>>> GetAll([FromQuery] Guid? organizationId)
    {
        if (organizationId is { } orgId)
        {
            var check = await CheckReadAccessAsync(orgId);
            if (check is not null) return check;
        }

        var query = Db.WarrantyItems.AsQueryable();
        if (organizationId is { } id) query = query.Where(w => w.OrganizationId == id);

        return Ok(await query
            .Select(w => new WarrantyItemDto(
                w.Id,
                w.Name,
                w.Vendor,
                w.SerialNumber,
                w.PurchaseDate,
                w.WarrantyEndDate,
                w.WarrantyType,
                w.ContactName,
                w.ContactPhone,
                w.ContactEmail,
                w.Notes,
                w.AssetId,
                w.Starred,
                w.Status,
                w.DocumentName == null
                    ? null
                    : new WarrantyDocumentDto(
                        w.DocumentName,
                        w.DocumentMimeType ?? "",
                        w.DocumentSize ?? 0
                    )
            ))
            .ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WarrantyItemDto>> GetById(Guid id)
    {
        var item = await Db.WarrantyItems.FirstOrDefaultAsync(w => w.Id == id);
        return item is null ? NotFound() : Ok(mapper.Map<WarrantyItemDto>(item));
    }

    [HttpPost]
    public async Task<ActionResult<WarrantyItemDto>> Create([FromQuery] Guid organizationId, CreateWarrantyItemDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        var item = mapper.Map<WarrantyItem>(dto);
        item.OrganizationId = organizationId;
        item.Status = CalcStatus(item.WarrantyEndDate);
        Db.WarrantyItems.Add(item);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, mapper.Map<WarrantyItemDto>(item));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateWarrantyItemDto dto)
    {
        var item = await Db.WarrantyItems.FirstOrDefaultAsync(w => w.Id == id);
        if (item is null) return NotFound();

        var check = await CheckWriteAccessAsync(item.OrganizationId);
        if (check is not null) return check;

        mapper.Map(dto, item);
        item.Status = CalcStatus(item.WarrantyEndDate);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await Db.WarrantyItems.FirstOrDefaultAsync(w => w.Id == id);
        if (item is null) return NotFound();

        var check = await CheckWriteAccessAsync(item.OrganizationId);
        if (check is not null) return check;

        if (item.DocumentBlobPath is not null) await storage.DeleteAsync(item.DocumentBlobPath);
        Db.WarrantyItems.Remove(item);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var item = await Db.WarrantyItems.FirstOrDefaultAsync(w => w.Id == id);
        if (item is null) return NotFound();

        var check = await CheckWriteAccessAsync(item.OrganizationId);
        if (check is not null) return check;

        item.Starred = !item.Starred;
        await Db.SaveChangesAsync();
        return Ok(new { item.Starred });
    }

    [HttpPost("{id:guid}/document")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadDocument(Guid id, IFormFile file)
    {
        var item = await Db.WarrantyItems.FirstOrDefaultAsync(w => w.Id == id);
        if (item is null) return NotFound();

        var check = await CheckWriteAccessAsync(item.OrganizationId);
        if (check is not null) return check;

        if (item.DocumentBlobPath is not null) await storage.DeleteAsync(item.DocumentBlobPath);

        var path = await storage.SaveAsync(file.OpenReadStream(), file.FileName, file.ContentType);
        item.DocumentName = file.FileName;
        item.DocumentMimeType = file.ContentType;
        item.DocumentSize = file.Length;
        item.DocumentBlobPath = path;
        await Db.SaveChangesAsync();
        return Ok(mapper.Map<WarrantyItemDto>(item));
    }

    [HttpGet("{id:guid}/document")]
    public async Task<IActionResult> DownloadDocument(Guid id)
    {
        var item = await Db.WarrantyItems.FirstOrDefaultAsync(w => w.Id == id);
        if (item?.DocumentBlobPath is null) return NotFound();

        var stream = await storage.OpenAsync(item.DocumentBlobPath);
        return File(stream, item.DocumentMimeType ?? "application/octet-stream", item.DocumentName);
    }

    private static WarrantyStatus CalcStatus(DateOnly end)
    {
        var days = end.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
        return days < 0 ? WarrantyStatus.Expired : days <= 60 ? WarrantyStatus.Expiring : WarrantyStatus.Active;
    }
}

public interface IFileStorage
{
    Task<string> SaveAsync(Stream content, string fileName, string contentType);
    Task<Stream> OpenAsync(string path);
    Task DeleteAsync(string path);
}

// ─── DiagramController ──────────────────────────────────────────────────────
// A diagram is inherently one-per-org, so organizationId is required here, not optional.
[ApiController]
[Route("api/diagram")]
public class DiagramController(AppDbContext db, IMapper mapper, ICurrentUserContext userContext) : OrgScopedController(db, userContext)
{
    [HttpGet]
    public async Task<ActionResult<DiagramDto>> Get([FromQuery] Guid organizationId)
    {
        var check = await CheckReadAccessAsync(organizationId);
        if (check is not null) return check;

        var nodes = await Db.DiagramNodes.Where(n => n.OrganizationId == organizationId).ToListAsync();
        var edges = await Db.DiagramEdges.Where(e => e.OrganizationId == organizationId).ToListAsync();
        return Ok(new DiagramDto(mapper.Map<List<DiagramNodeDto>>(nodes), mapper.Map<List<DiagramEdgeDto>>(edges)));
    }

    [HttpPut]
    public async Task<IActionResult> Save([FromQuery] Guid organizationId, SaveDiagramDto dto)
    {
        var check = await CheckWriteAccessAsync(organizationId);
        if (check is not null) return check;

        await using var tx = await Db.Database.BeginTransactionAsync();

        var existingNodes = await Db.DiagramNodes.Where(n => n.OrganizationId == organizationId).ToListAsync();
        var existingEdges = await Db.DiagramEdges.Where(e => e.OrganizationId == organizationId).ToListAsync();
        Db.DiagramEdges.RemoveRange(existingEdges);
        Db.DiagramNodes.RemoveRange(existingNodes);
        await Db.SaveChangesAsync();
        // ^ flush deletes first — this detaches the removed entities from the
        // change tracker, so re-adding entities with the same PKs below doesn't
        // collide with them in EF's identity map (the actual cause of the
        // "association has been severed" error with same-key delete+recreate).

        var nodes = mapper.Map<List<DiagramNode>>(dto.Nodes);
        nodes.ForEach(n => n.OrganizationId = organizationId);
        var edges = mapper.Map<List<DiagramEdge>>(dto.Edges);
        edges.ForEach(e => e.OrganizationId = organizationId);

        Db.DiagramNodes.AddRange(nodes);
        Db.DiagramEdges.AddRange(edges);
        await Db.SaveChangesAsync();

        await tx.CommitAsync();
        return NoContent();
    }
}