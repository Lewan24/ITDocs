using System.Text.Json.Serialization;

namespace ITDocsApi.Domain.Entities;

public enum AssetType { Server, Workstation, Network, Storage, AP, Printer, Phone }
public enum AssetStatus
{
    [JsonStringEnumMemberName("online")] Online,
    [JsonStringEnumMemberName("offline")] Offline,
    [JsonStringEnumMemberName("maintenance")] Maintenance,
    [JsonStringEnumMemberName("unknown")] Unknown
}
public enum PasswordStrength { Strong, Medium, Weak }
public enum IPEntryStatus { Used, Reserved, Free }
public enum SubnetType { LAN, DMZ, WAN, WLAN, MGMT, VPN }
public enum LicenseType { Subscription, Perpetual, OEM, Volume, Trial }
public enum LicenseCategory { Software, OS, Antivirus, Domain, Cloud, Security, Office, Virtualization, Backup, Monitoring, Other }
public enum LicenseStatus { Active, Expiring, Expired, Inactive }
public enum ContractCategory { Service, Support, Maintenance, Lease, NDA, SLA, Software, Other }
public enum ContractStatus { Active, Expiring, Expired, Draft }
public enum Priority { High, Medium, Low }

public enum PlanStatus
{
    [JsonStringEnumMemberName("planned")]
    Planned,
    [JsonStringEnumMemberName("in-progress")]
    InProgress,
    [JsonStringEnumMemberName("completed")]
    Completed,
    [JsonStringEnumMemberName("cancelled")]
    Cancelled
}
public enum IncidentSeverity { Critical, High, Medium, Low }
public enum IncidentStatus { Open, Investigating, Resolved, Closed }

public enum WorkTaskStatus
{
    [JsonStringEnumMemberName("todo")]
    Todo,
    [JsonStringEnumMemberName("in-progress")]
    InProgress,
    [JsonStringEnumMemberName("done")]
    Done
}
public enum GroupType
{
    [JsonStringEnumMemberName("AD Security")] AdSecurity,
    [JsonStringEnumMemberName("AD Distribution")] AdDistribution,
    [JsonStringEnumMemberName("AD OU")] AdOu,
    [JsonStringEnumMemberName("Local Group")] LocalGroup,
    [JsonStringEnumMemberName("VLAN Group")] VlanGroup,
    [JsonStringEnumMemberName("Project Team")] ProjectTeam,
    [JsonStringEnumMemberName("Other")] Other
}
public enum WarrantyType { Standard, Extended, OnSiteNbd, CarryIn, MailIn, Other }
public enum WarrantyStatus { Active, Expiring, Expired }
public enum DiagramDeviceType { Server, Firewall, Switch, Router, Workstation, Ap, Storage, Cloud, Internet, Printer, Custom }
public enum DiagramConnectionType { Ethernet, Fiber, Wireless, Vpn, Wan }