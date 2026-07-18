using ITDocsApi.Domain.Dtos;
using ITDocsApi.Domain.Entities;

namespace ITDocsApi.Domain;

using AutoMapper;

public class AppMappingProfile : Profile
{
    public AppMappingProfile()
    {
        CreateMap<Organization, OrganizationDto>();
        CreateMap<CreateOrganizationDto, Organization>();
        CreateMap<UpdateOrganizationDto, Organization>();

        CreateMap<Asset, AssetDto>();
        CreateMap<CreateAssetDto, Asset>();
        CreateMap<UpdateAssetDto, Asset>();

        // Password: entity -> list DTO only (never map the encrypted bytes out)
        CreateMap<PasswordEntry, PasswordListDto>();
        CreateMap<CreatePasswordDto, PasswordEntry>()
            .ForMember(d => d.EncryptedPassword, o => o.Ignore()); // set explicitly in controller
        CreateMap<UpdatePasswordDto, PasswordEntry>()
            .ForMember(d => d.EncryptedPassword, o => o.Ignore());

        CreateMap<IPEntry, IPEntryDto>();
        CreateMap<CreateIPEntryDto, IPEntry>();
        CreateMap<UpdateIPEntryDto, IPEntry>();
        CreateMap<Subnet, SubnetDto>();
        CreateMap<CreateSubnetDto, Subnet>();
        CreateMap<UpdateSubnetDto, Subnet>();

        CreateMap<License, LicenseDto>();
        CreateMap<CreateLicenseDto, License>();
        CreateMap<UpdateLicenseDto, License>();

        CreateMap<Contact, ContactDto>();
        CreateMap<CreateContactDto, Contact>();
        CreateMap<UpdateContactDto, Contact>();

        CreateMap<Contract, ContractDto>();
        CreateMap<CreateContractDto, Contract>();
        CreateMap<UpdateContractDto, Contract>();

        CreateMap<Plan, PlanDto>();
        CreateMap<CreatePlanDto, Plan>();
        CreateMap<UpdatePlanDto, Plan>();

        CreateMap<Incident, IncidentDto>();
        CreateMap<CreateIncidentDto, Incident>();
        CreateMap<UpdateIncidentDto, Incident>();

        CreateMap<KnowledgeArticle, KnowledgeArticleDto>();
        CreateMap<CreateKnowledgeArticleDto, KnowledgeArticle>();
        CreateMap<UpdateKnowledgeArticleDto, KnowledgeArticle>();

        CreateMap<WorkTask, WorkTaskDto>();
        CreateMap<CreateWorkTaskDto, WorkTask>();
        CreateMap<UpdateWorkTaskDto, WorkTask>();

        CreateMap<Group, GroupDto>();
        CreateMap<CreateGroupDto, Group>();
        CreateMap<UpdateGroupDto, Group>();

        CreateMap<WarrantyItem, WarrantyItemDto>();
        CreateMap<CreateWarrantyItemDto, WarrantyItem>();
        CreateMap<UpdateWarrantyItemDto, WarrantyItem>();

        CreateMap<DiagramNode, DiagramNodeDto>();
        CreateMap<DiagramNodeDto, DiagramNode>();

        CreateMap<DiagramEdge, DiagramEdgeDto>()
            .ConstructUsing(s => new DiagramEdgeDto(s.Id, s.SourceNodeId, s.TargetNodeId, s.Label, s.ConnectionType));

        CreateMap<DiagramEdgeDto, DiagramEdge>()
            .ConstructUsing(s => new DiagramEdge
            {
                Id = s.Id,
                SourceNodeId = s.Source,
                TargetNodeId = s.Target,
                Label = s.Label,
                ConnectionType = s.ConnectionType,
                // OrganizationId is set explicitly by the controller after mapping — leave default here
            });
    }
}