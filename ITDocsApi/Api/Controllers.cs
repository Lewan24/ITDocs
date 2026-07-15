using AutoMapper;
using AutoMapper.QueryableExtensions;
using ITDocsApi.Domain.Dtos;
using ITDocsApi.Domain.Entities;
using ITDocsApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITDocsApi.Api;

// ─── OrganizationsController ────────────────────────────────────────────────
[ApiController]
[Route("api/organizations")]
[Authorize]
public class OrganizationsController(AppDbContext db, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<OrganizationDto>>> GetAll()
        => Ok(await db.Organizations.ProjectTo<OrganizationDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrganizationDto>> GetById(Guid id)
    {
        var org = await db.Organizations.FindAsync(id);
        return org is null ? NotFound() : Ok(mapper.Map<OrganizationDto>(org));
    }

    [HttpPost]
    public async Task<ActionResult<OrganizationDto>> Create(CreateOrganizationDto dto)
    {
        var org = mapper.Map<Organization>(dto);
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = org.Id }, mapper.Map<OrganizationDto>(org));
    }
}

// ─── AssetsController ───────────────────────────────────────────────────────
[ApiController]
[Route("api/assets")]
[Authorize]
public class AssetsController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AssetDto>>> GetAll()
        => Ok(await db.Assets.ProjectTo<AssetDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssetDto>> GetById(Guid id)
    {
        var asset = await db.Assets.FindAsync(id);
        return asset is null ? NotFound() : Ok(mapper.Map<AssetDto>(asset));
    }

    [HttpPost]
    public async Task<ActionResult<AssetDto>> Create(CreateAssetDto dto)
    {
        var asset = mapper.Map<Asset>(dto);
        asset.OrganizationId = org.OrganizationId!.Value;
        asset.UpdatedAt = DateTime.UtcNow;
        db.Assets.Add(asset);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = asset.Id }, mapper.Map<AssetDto>(asset));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateAssetDto dto)
    {
        var asset = await db.Assets.FindAsync(id);
        if (asset is null) return NotFound();
        mapper.Map(dto, asset);
        asset.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var asset = await db.Assets.FindAsync(id);
        if (asset is null) return NotFound();
        db.Assets.Remove(asset);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var asset = await db.Assets.FindAsync(id);
        if (asset is null) return NotFound();
        asset.Starred = !asset.Starred;
        await db.SaveChangesAsync();
        return Ok(new { asset.Starred });
    }
}

// ─── PasswordsController ────────────────────────────────────────────────────
[ApiController]
[Route("api/passwords")]
[Authorize]
public class PasswordsController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org, IPasswordCipher cipher) : ControllerBase
{
    // List view NEVER decrypts — DTO omits the secret entirely
    [HttpGet]
    public async Task<ActionResult<List<PasswordListDto>>> GetAll()
        => Ok(await db.Passwords.ProjectTo<PasswordListDto>(mapper.ConfigurationProvider).ToListAsync());

    // Reveal is a separate, explicit, auditable action
    [HttpGet("{id:guid}/reveal")]
    public async Task<ActionResult<string>> Reveal(Guid id)
    {
        var entry = await db.Passwords.FindAsync(id);
        if (entry is null) return NotFound();
        // TODO: write an audit log entry here (who revealed what, when)
        return Ok(cipher.Decrypt(entry.EncryptedPassword));
    }

    [HttpPost]
    public async Task<ActionResult<PasswordListDto>> Create(CreatePasswordDto dto)
    {
        var entry = mapper.Map<PasswordEntry>(dto);
        entry.OrganizationId = org.OrganizationId!.Value;
        entry.EncryptedPassword = cipher.Encrypt(dto.Password);
        entry.Strength = CalcStrength(dto.Password);
        entry.UpdatedAt = DateTime.UtcNow;
        db.Passwords.Add(entry);
        await db.SaveChangesAsync();
        return Ok(mapper.Map<PasswordListDto>(entry));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdatePasswordDto dto)
    {
        var entry = await db.Passwords.FindAsync(id);
        if (entry is null) return NotFound();
        mapper.Map(dto, entry);
        if (!string.IsNullOrEmpty(dto.Password))
        {
            entry.EncryptedPassword = cipher.Encrypt(dto.Password);
            entry.Strength = CalcStrength(dto.Password);
        }
        entry.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entry = await db.Passwords.FindAsync(id);
        if (entry is null) return NotFound();
        db.Passwords.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var entry = await db.Passwords.FindAsync(id);
        if (entry is null) return NotFound();
        entry.Starred = !entry.Starred;
        await db.SaveChangesAsync();
        return Ok(new { entry.Starred });
    }

    private static PasswordStrength CalcStrength(string pw) =>
        pw.Length >= 16 && pw.Any(char.IsUpper) && pw.Any(char.IsDigit) && pw.Any(c => !char.IsLetterOrDigit(c))
            ? PasswordStrength.Strong
            : pw.Length >= 10 ? PasswordStrength.Medium : PasswordStrength.Weak;
}

// Minimal cipher abstraction — implement with IDataProtector or a KMS-backed provider
public interface IPasswordCipher
{
    byte[] Encrypt(string plaintext);
    string Decrypt(byte[] ciphertext);
}

// ─── SubnetsController ──────────────────────────────────────────────────────
[ApiController]
[Route("api/subnets")]
[Authorize]
public class SubnetsController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SubnetDto>>> GetAll()
        => Ok(await db.Subnets.Include(s => s.Ips)
                               .ProjectTo<SubnetDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubnetDto>> GetById(Guid id)
    {
        var subnet = await db.Subnets.Include(s => s.Ips).FirstOrDefaultAsync(s => s.Id == id);
        return subnet is null ? NotFound() : Ok(mapper.Map<SubnetDto>(subnet));
    }

    [HttpPost]
    public async Task<ActionResult<SubnetDto>> Create(CreateSubnetDto dto)
    {
        var subnet = mapper.Map<Subnet>(dto);
        subnet.OrganizationId = org.OrganizationId!.Value;
        db.Subnets.Add(subnet);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = subnet.Id }, mapper.Map<SubnetDto>(subnet));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSubnetDto dto)
    {
        var subnet = await db.Subnets.FindAsync(id);
        if (subnet is null) return NotFound();
        mapper.Map(dto, subnet);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var subnet = await db.Subnets.FindAsync(id);
        if (subnet is null) return NotFound();
        db.Subnets.Remove(subnet); // cascades to IPEntry rows
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Nested IP entries ──
    [HttpPost("{subnetId:guid}/ips")]
    public async Task<ActionResult<IPEntryDto>> AddIp(Guid subnetId, CreateIPEntryDto dto)
    {
        var subnet = await db.Subnets.FindAsync(subnetId);
        if (subnet is null) return NotFound();
        var entry = mapper.Map<IPEntry>(dto);
        entry.SubnetId = subnetId;
        db.IPEntries.Add(entry);
        await db.SaveChangesAsync();
        return Ok(mapper.Map<IPEntryDto>(entry));
    }

    [HttpPut("{subnetId:guid}/ips/{entryId:guid}")]
    public async Task<IActionResult> UpdateIp(Guid subnetId, Guid entryId, UpdateIPEntryDto dto)
    {
        var entry = await db.IPEntries.FirstOrDefaultAsync(ip => ip.Id == entryId && ip.SubnetId == subnetId);
        if (entry is null) return NotFound();
        mapper.Map(dto, entry);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{subnetId:guid}/ips/{entryId:guid}")]
    public async Task<IActionResult> DeleteIp(Guid subnetId, Guid entryId)
    {
        var entry = await db.IPEntries.FirstOrDefaultAsync(ip => ip.Id == entryId && ip.SubnetId == subnetId);
        if (entry is null) return NotFound();
        db.IPEntries.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── LicensesController ─────────────────────────────────────────────────────
[ApiController]
[Route("api/licenses")]
[Authorize]
public class LicensesController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<LicenseDto>>> GetAll()
        => Ok(await db.Licenses.ProjectTo<LicenseDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LicenseDto>> GetById(Guid id)
    {
        var license = await db.Licenses.FindAsync(id);
        return license is null ? NotFound() : Ok(mapper.Map<LicenseDto>(license));
    }

    [HttpPost]
    public async Task<ActionResult<LicenseDto>> Create(CreateLicenseDto dto)
    {
        var license = mapper.Map<License>(dto);
        license.OrganizationId = org.OrganizationId!.Value;
        license.Status = CalcStatus(license.ExpiryDate);
        db.Licenses.Add(license);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = license.Id }, mapper.Map<LicenseDto>(license));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateLicenseDto dto)
    {
        var license = await db.Licenses.FindAsync(id);
        if (license is null) return NotFound();
        mapper.Map(dto, license);
        license.Status = CalcStatus(license.ExpiryDate);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var license = await db.Licenses.FindAsync(id);
        if (license is null) return NotFound();
        db.Licenses.Remove(license);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var license = await db.Licenses.FindAsync(id);
        if (license is null) return NotFound();
        license.Starred = !license.Starred;
        await db.SaveChangesAsync();
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
[Authorize]
public class ContactsController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ContactDto>>> GetAll()
        => Ok(await db.Contacts.ProjectTo<ContactDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContactDto>> GetById(Guid id)
    {
        var contact = await db.Contacts.FindAsync(id);
        return contact is null ? NotFound() : Ok(mapper.Map<ContactDto>(contact));
    }

    [HttpPost]
    public async Task<ActionResult<ContactDto>> Create(CreateContactDto dto)
    {
        var contact = mapper.Map<Contact>(dto);
        contact.OrganizationId = org.OrganizationId!.Value;
        db.Contacts.Add(contact);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = contact.Id }, mapper.Map<ContactDto>(contact));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateContactDto dto)
    {
        var contact = await db.Contacts.FindAsync(id);
        if (contact is null) return NotFound();
        mapper.Map(dto, contact);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var contact = await db.Contacts.FindAsync(id);
        if (contact is null) return NotFound();
        db.Contacts.Remove(contact);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var contact = await db.Contacts.FindAsync(id);
        if (contact is null) return NotFound();
        contact.Starred = !contact.Starred;
        await db.SaveChangesAsync();
        return Ok(new { contact.Starred });
    }
}

// ─── ContractsController ────────────────────────────────────────────────────
[ApiController]
[Route("api/contracts")]
[Authorize]
public class ContractsController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ContractDto>>> GetAll()
        => Ok(await db.Contracts.ProjectTo<ContractDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContractDto>> GetById(Guid id)
    {
        var contract = await db.Contracts.FindAsync(id);
        return contract is null ? NotFound() : Ok(mapper.Map<ContractDto>(contract));
    }

    [HttpPost]
    public async Task<ActionResult<ContractDto>> Create(CreateContractDto dto)
    {
        var contract = mapper.Map<Contract>(dto);
        contract.OrganizationId = org.OrganizationId!.Value;
        contract.Status = CalcStatus(contract.EndDate);
        db.Contracts.Add(contract);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = contract.Id }, mapper.Map<ContractDto>(contract));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateContractDto dto)
    {
        var contract = await db.Contracts.FindAsync(id);
        if (contract is null) return NotFound();
        mapper.Map(dto, contract);
        contract.Status = CalcStatus(contract.EndDate);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var contract = await db.Contracts.FindAsync(id);
        if (contract is null) return NotFound();
        db.Contracts.Remove(contract);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var contract = await db.Contracts.FindAsync(id);
        if (contract is null) return NotFound();
        contract.Starred = !contract.Starred;
        await db.SaveChangesAsync();
        return Ok(new { contract.Starred });
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
[Authorize]
public class PlansController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PlanDto>>> GetAll()
        => Ok(await db.Plans.ProjectTo<PlanDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlanDto>> GetById(Guid id)
    {
        var plan = await db.Plans.FindAsync(id);
        return plan is null ? NotFound() : Ok(mapper.Map<PlanDto>(plan));
    }

    [HttpPost]
    public async Task<ActionResult<PlanDto>> Create(CreatePlanDto dto)
    {
        var plan = mapper.Map<Plan>(dto);
        plan.OrganizationId = org.OrganizationId!.Value;
        plan.CreatedAt = DateTime.UtcNow;
        db.Plans.Add(plan);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, mapper.Map<PlanDto>(plan));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdatePlanDto dto)
    {
        var plan = await db.Plans.FindAsync(id);
        if (plan is null) return NotFound();
        mapper.Map(dto, plan);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var plan = await db.Plans.FindAsync(id);
        if (plan is null) return NotFound();
        db.Plans.Remove(plan);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── IncidentsController ────────────────────────────────────────────────────
[ApiController]
[Route("api/incidents")]
[Authorize]
public class IncidentsController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<IncidentDto>>> GetAll()
        => Ok(await db.Incidents.ProjectTo<IncidentDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<IncidentDto>> GetById(Guid id)
    {
        var incident = await db.Incidents.FindAsync(id);
        return incident is null ? NotFound() : Ok(mapper.Map<IncidentDto>(incident));
    }

    [HttpPost]
    public async Task<ActionResult<IncidentDto>> Create(CreateIncidentDto dto)
    {
        var incident = mapper.Map<Incident>(dto);
        incident.OrganizationId = org.OrganizationId!.Value;
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = incident.Id }, mapper.Map<IncidentDto>(incident));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateIncidentDto dto)
    {
        var incident = await db.Incidents.FindAsync(id);
        if (incident is null) return NotFound();
        mapper.Map(dto, incident);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var incident = await db.Incidents.FindAsync(id);
        if (incident is null) return NotFound();
        db.Incidents.Remove(incident);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── KnowledgeController ────────────────────────────────────────────────────
[ApiController]
[Route("api/knowledge")]
[Authorize]
public class KnowledgeController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<KnowledgeArticleDto>>> GetAll()
        => Ok(await db.KnowledgeArticles.ProjectTo<KnowledgeArticleDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<KnowledgeArticleDto>> GetById(Guid id)
    {
        var article = await db.KnowledgeArticles.FindAsync(id);
        return article is null ? NotFound() : Ok(mapper.Map<KnowledgeArticleDto>(article));
    }

    [HttpPost]
    public async Task<ActionResult<KnowledgeArticleDto>> Create(CreateKnowledgeArticleDto dto)
    {
        var article = mapper.Map<KnowledgeArticle>(dto);
        article.OrganizationId = org.OrganizationId!.Value;
        article.UpdatedAt = DateTime.UtcNow;
        db.KnowledgeArticles.Add(article);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = article.Id }, mapper.Map<KnowledgeArticleDto>(article));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateKnowledgeArticleDto dto)
    {
        var article = await db.KnowledgeArticles.FindAsync(id);
        if (article is null) return NotFound();
        mapper.Map(dto, article);
        article.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var article = await db.KnowledgeArticles.FindAsync(id);
        if (article is null) return NotFound();
        db.KnowledgeArticles.Remove(article);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var article = await db.KnowledgeArticles.FindAsync(id);
        if (article is null) return NotFound();
        article.Starred = !article.Starred;
        await db.SaveChangesAsync();
        return Ok(new { article.Starred });
    }
}

// ─── TasksController ────────────────────────────────────────────────────────
[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<WorkTaskDto>>> GetAll()
        => Ok(await db.Tasks.ProjectTo<WorkTaskDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkTaskDto>> GetById(Guid id)
    {
        var task = await db.Tasks.FindAsync(id);
        return task is null ? NotFound() : Ok(mapper.Map<WorkTaskDto>(task));
    }

    [HttpPost]
    public async Task<ActionResult<WorkTaskDto>> Create(CreateWorkTaskDto dto)
    {
        var task = mapper.Map<WorkTask>(dto);
        task.OrganizationId = org.OrganizationId!.Value;
        task.CreatedAt = DateTime.UtcNow;
        db.Tasks.Add(task);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, mapper.Map<WorkTaskDto>(task));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateWorkTaskDto dto)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null) return NotFound();
        mapper.Map(dto, task);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null) return NotFound();
        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── GroupsController ───────────────────────────────────────────────────────
[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<GroupDto>>> GetAll()
        => Ok(await db.Groups.ProjectTo<GroupDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupDto>> GetById(Guid id)
    {
        var group = await db.Groups.FindAsync(id);
        return group is null ? NotFound() : Ok(mapper.Map<GroupDto>(group));
    }

    [HttpPost]
    public async Task<ActionResult<GroupDto>> Create(CreateGroupDto dto)
    {
        var group = mapper.Map<Group>(dto);
        group.OrganizationId = org.OrganizationId!.Value;
        group.CreatedAt = DateTime.UtcNow;
        db.Groups.Add(group);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = group.Id }, mapper.Map<GroupDto>(group));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateGroupDto dto)
    {
        var group = await db.Groups.FindAsync(id);
        if (group is null) return NotFound();
        mapper.Map(dto, group);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var group = await db.Groups.FindAsync(id);
        if (group is null) return NotFound();
        db.Groups.Remove(group);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── WarrantiesController ───────────────────────────────────────────────────
[ApiController]
[Route("api/warranties")]
[Authorize]
public class WarrantiesController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org, IFileStorage storage) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<WarrantyItemDto>>> GetAll()
        => Ok(await db.WarrantyItems.ProjectTo<WarrantyItemDto>(mapper.ConfigurationProvider).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WarrantyItemDto>> GetById(Guid id)
    {
        var item = await db.WarrantyItems.FindAsync(id);
        return item is null ? NotFound() : Ok(mapper.Map<WarrantyItemDto>(item));
    }

    [HttpPost]
    public async Task<ActionResult<WarrantyItemDto>> Create(CreateWarrantyItemDto dto)
    {
        var item = mapper.Map<WarrantyItem>(dto);
        item.OrganizationId = org.OrganizationId!.Value;
        item.Status = CalcStatus(item.WarrantyEndDate);
        db.WarrantyItems.Add(item);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, mapper.Map<WarrantyItemDto>(item));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateWarrantyItemDto dto)
    {
        var item = await db.WarrantyItems.FindAsync(id);
        if (item is null) return NotFound();
        mapper.Map(dto, item);
        item.Status = CalcStatus(item.WarrantyEndDate);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.WarrantyItems.FindAsync(id);
        if (item is null) return NotFound();
        if (item.DocumentBlobPath is not null) await storage.DeleteAsync(item.DocumentBlobPath);
        db.WarrantyItems.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/star")]
    public async Task<IActionResult> ToggleStar(Guid id)
    {
        var item = await db.WarrantyItems.FindAsync(id);
        if (item is null) return NotFound();
        item.Starred = !item.Starred;
        await db.SaveChangesAsync();
        return Ok(new { item.Starred });
    }

    [HttpPost("{id:guid}/document")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadDocument(Guid id, IFormFile file)
    {
        var item = await db.WarrantyItems.FindAsync(id);
        if (item is null) return NotFound();

        if (item.DocumentBlobPath is not null) await storage.DeleteAsync(item.DocumentBlobPath);

        var path = await storage.SaveAsync(file.OpenReadStream(), file.FileName, file.ContentType);
        item.DocumentName = file.FileName;
        item.DocumentMimeType = file.ContentType;
        item.DocumentSize = file.Length;
        item.DocumentBlobPath = path;
        await db.SaveChangesAsync();
        return Ok(mapper.Map<WarrantyItemDto>(item));
    }

    [HttpGet("{id:guid}/document")]
    public async Task<IActionResult> DownloadDocument(Guid id)
    {
        var item = await db.WarrantyItems.FindAsync(id);
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
[ApiController]
[Route("api/diagram")]
[Authorize]
public class DiagramController(AppDbContext db, IMapper mapper, ICurrentOrgAccessor org) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DiagramDto>> Get()
    {
        var nodes = await db.DiagramNodes.ToListAsync();
        var edges = await db.DiagramEdges.ToListAsync();
        return Ok(new DiagramDto(Nodes: mapper.Map<List<DiagramNodeDto>>(nodes),
            Edges: mapper.Map<List<DiagramEdgeDto>>(edges)));
    }

    // Mirrors the frontend's SAVE_DIAGRAM action: full replace of nodes+edges
    [HttpPut]
    public async Task<IActionResult> Save(SaveDiagramDto dto)
    {
        var orgId = org.OrganizationId!.Value;

        var existingNodes = await db.DiagramNodes.ToListAsync();
        var existingEdges = await db.DiagramEdges.ToListAsync();
        db.DiagramEdges.RemoveRange(existingEdges); // remove edges first (FK to nodes)
        db.DiagramNodes.RemoveRange(existingNodes);

        var nodes = mapper.Map<List<DiagramNode>>(dto.Nodes);
        nodes.ForEach(n => n.OrganizationId = orgId);
        var edges = mapper.Map<List<DiagramEdge>>(dto.Edges);
        edges.ForEach(e => e.OrganizationId = orgId);

        db.DiagramNodes.AddRange(nodes);
        db.DiagramEdges.AddRange(edges);
        await db.SaveChangesAsync();
        return NoContent();
    }
}