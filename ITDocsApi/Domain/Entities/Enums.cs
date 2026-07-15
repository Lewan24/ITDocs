namespace ITDocsApi.Domain.Entities;


public enum AssetType { Server, Workstation, Network, Storage, AP, Printer, Phone }
public enum AssetStatus { Online, Offline, Maintenance, Unknown }
public enum PasswordStrength { Strong, Medium, Weak }
public enum IPEntryStatus { Used, Reserved, Free }
public enum SubnetType { LAN, DMZ, WAN, WLAN, MGMT, VPN }
public enum LicenseType { Subscription, Perpetual, OEM, Volume, Trial }
public enum LicenseCategory { Software, OS, Antivirus, Domain, Cloud, Security, Office, Virtualization, Backup, Monitoring, Other }
public enum LicenseStatus { Active, Expiring, Expired, Inactive }
public enum ContractCategory { Service, Support, Maintenance, Lease, NDA, SLA, Software, Other }
public enum ContractStatus { Active, Expiring, Expired, Draft }
public enum Priority { High, Medium, Low }
public enum PlanStatus { Planned, InProgress, Completed, Cancelled }
public enum IncidentSeverity { Critical, High, Medium, Low }
public enum IncidentStatus { Open, Investigating, Resolved, Closed }
public enum WorkTaskStatus { Todo, InProgress, Done } // "Task" name conflicts with System.Threading.Tasks.Task
public enum GroupType { AdSecurity, AdDistribution, AdOu, LocalGroup, VlanGroup, ProjectTeam, Other }
public enum WarrantyType { Standard, Extended, OnSiteNbd, CarryIn, MailIn, Other }
public enum WarrantyStatus { Active, Expiring, Expired }
public enum DiagramDeviceType { Server, Firewall, Switch, Router, Workstation, Ap, Storage, Cloud, Internet, Printer, Custom }
public enum DiagramConnectionType { Ethernet, Fiber, Wireless, Vpn, Wan }