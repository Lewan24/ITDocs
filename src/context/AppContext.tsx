import { useReducer, useCallback, type ReactNode } from 'react'
import { AppContext } from './useApp'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetType = 'Server' | 'Workstation' | 'Network' | 'Storage' | 'AP' | 'Printer' | 'Phone'
export type AssetStatus = 'online' | 'offline' | 'maintenance' | 'unknown'
export type PasswordStrength = 'strong' | 'medium' | 'weak'
export type IPEntryStatus = 'used' | 'reserved' | 'free'
export type SubnetType = 'LAN' | 'DMZ' | 'WAN' | 'WLAN' | 'MGMT' | 'VPN'
export type LicenseType = 'Subscription' | 'Perpetual' | 'OEM' | 'Volume' | 'Trial'
export type LicenseCategory = 'Software' | 'OS' | 'Antivirus' | 'Domain' | 'Cloud' | 'Security' | 'Office' | 'Virtualization' | 'Backup' | 'Monitoring' | 'Other'
export type LicenseStatus = 'active' | 'expiring' | 'expired' | 'inactive'
export type ContractCategory = 'Service' | 'Support' | 'Maintenance' | 'Lease' | 'NDA' | 'SLA' | 'Software' | 'Other'
export type ContractStatus = 'active' | 'expiring' | 'expired' | 'draft'
export type Priority = 'high' | 'medium' | 'low'
export type PlanStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled'
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type GroupType = 'AD Security' | 'AD Distribution' | 'AD OU' | 'Local Group' | 'VLAN Group' | 'Project Team' | 'Other'
export type WarrantyType = 'Standard' | 'Extended' | 'On-Site NBD' | 'Carry-In' | 'Mail-In' | 'Other'
export type WarrantyStatus = 'active' | 'expiring' | 'expired'
export type DiagramDeviceType = 'server' | 'firewall' | 'switch' | 'router' | 'workstation' | 'ap' | 'storage' | 'cloud' | 'internet' | 'printer' | 'custom'
export type DiagramConnectionType = 'ethernet' | 'fiber' | 'wireless' | 'vpn' | 'wan'

export interface Organization { id: string; name: string; color: string; initials: string; description: string }

export interface Asset {
  id: string; name: string; type: AssetType; status: AssetStatus; location: string
  owner: string; ip: string; updated: string; starred: boolean; tags: string[]; notes: string; serial?: string
}

export interface PasswordEntry {
  id: string; name: string; username: string; password: string; category: string
  tags: string[]; updated: string; strength: PasswordStrength; starred: boolean; notes: string
}

export interface IPEntry { id: string; ip: string; label: string; status: IPEntryStatus; assetId?: string; plainText?: string; notes: string }

export interface Subnet {
  id: string; name: string; cidr: string; vlan?: number; type: SubnetType
  gateway: string; dns: string; description: string; ips: IPEntry[]
}

export interface License {
  id: string; name: string; vendor: string; category: LicenseCategory; type: LicenseType
  seats: number; seatsUsed: number; purchaseDate: string; expiryDate: string
  cost: number; currency: string; licenseKey: string; notes: string; starred: boolean; status: LicenseStatus
}

export interface Contact {
  id: string; name: string; company: string; role: string; phone: string
  email: string; description: string; tags: string[]; starred: boolean
}

export interface Contract {
  id: string; name: string; vendor: string; category: ContractCategory
  startDate: string; endDate: string; value: number; currency: string
  autoRenew: boolean; notes: string; starred: boolean; status: ContractStatus
}

export interface Plan {
  id: string; title: string; description: string; priority: Priority
  status: PlanStatus; targetDate: string; tags: string[]; createdAt: string
}

export interface Incident {
  id: string; title: string; severity: IncidentSeverity; status: IncidentStatus
  description: string; resolution: string; affectedSystems: string[]
  occurredAt: string; resolvedAt: string; tags: string[]
}

export interface KnowledgeArticle {
  id: string; title: string; category: string; content: string
  tags: string[]; updatedAt: string; starred: boolean
}

export interface Task {
  id: string; title: string; description: string; priority: Priority
  status: TaskStatus; assignee: string; dueDate: string; tags: string[]; createdAt: string
}

export interface Group {
  id: string; name: string; type: GroupType; description: string; purpose: string
  members: string[]; linkedAssets: string[]; tags: string[]; createdAt: string
}

export interface WarrantyDocument { name: string; mimeType: string; size: number; data: string }

export interface WarrantyItem {
  id: string; name: string; vendor: string; serialNumber: string
  purchaseDate: string; warrantyEndDate: string; warrantyType: WarrantyType
  contactName: string; contactPhone: string; contactEmail: string
  notes: string; assetId?: string; document?: WarrantyDocument
  starred: boolean; status: WarrantyStatus
}

export interface DiagramNode {
  id: string; deviceType: DiagramDeviceType; label: string; ip?: string
  assetId?: string; x: number; y: number; color?: string
}

export interface DiagramEdge {
  id: string; source: string; target: string
  label?: string; connectionType: DiagramConnectionType
}

export interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' }

export interface OrgData {
  assets: Asset[]
  passwords: PasswordEntry[]
  subnets: Subnet[]
  licenses: License[]
  contacts: Contact[]
  contracts: Contract[]
  plans: Plan[]
  incidents: Incident[]
  knowledgeArticles: KnowledgeArticle[]
  tasks: Task[]
  groups: Group[]
  warrantyItems: WarrantyItem[]
  diagramNodes: DiagramNode[]
  diagramEdges: DiagramEdge[]
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const ACME_ASSETS: Asset[] = [
  { id: '1', name: 'SRV-PROD-01', type: 'Server', status: 'online', location: 'DC-RACK-A1', owner: 'John Doe', ip: '10.0.1.10', updated: '2h ago', starred: true, tags: ['production', 'vmware', 'critical'], notes: 'Primary production hypervisor. Hosts 14 VMs.', serial: 'BCZK1234567' },
  { id: '2', name: 'SRV-PROD-02', type: 'Server', status: 'online', location: 'DC-RACK-A1', owner: 'John Doe', ip: '10.0.1.11', updated: '2h ago', starred: false, tags: ['production', 'vmware'], notes: 'Secondary production hypervisor.', serial: 'BCZK1234568' },
  { id: '3', name: 'SRV-DEV-01', type: 'Server', status: 'maintenance', location: 'DC-RACK-B2', owner: 'Sarah K.', ip: '10.0.2.10', updated: '1d ago', starred: false, tags: ['dev', 'docker'], notes: 'Dev environment. Scheduled RAM upgrade Q3 2026.' },
  { id: '4', name: 'WS-ADMIN-01', type: 'Workstation', status: 'online', location: 'Office 3F', owner: 'John Doe', ip: '10.1.0.50', updated: '3h ago', starred: false, tags: ['admin', 'workstation'], notes: '' },
  { id: '5', name: 'WS-DEV-42', type: 'Workstation', status: 'online', location: 'Office 2F', owner: 'Mike T.', ip: '10.1.0.91', updated: '5h ago', starred: false, tags: ['dev'], notes: '' },
  { id: '6', name: 'FW-EDGE-01', type: 'Network', status: 'online', location: 'DC-RACK-A0', owner: 'John Doe', ip: '10.0.0.1', updated: '4h ago', starred: true, tags: ['network', 'firewall', 'critical'], notes: 'Perimeter FortiGate 100F.' },
  { id: '7', name: 'SW-CORE-01', type: 'Network', status: 'maintenance', location: 'DC-RACK-A0', owner: 'Sarah K.', ip: '10.0.0.2', updated: '2d ago', starred: true, tags: ['network', 'core'], notes: 'Core L3 switch. Port 48 down for investigation.' },
  { id: '8', name: 'NAS-BACKUP', type: 'Storage', status: 'online', location: 'DC-RACK-C1', owner: 'Mike T.', ip: '10.0.3.5', updated: '1d ago', starred: true, tags: ['storage', 'backup'], notes: 'QNAP TS-1264U. 96TB raw.' },
  { id: '9', name: 'AP-3F-MAIN', type: 'AP', status: 'online', location: 'Office 3F', owner: 'Sarah K.', ip: '192.168.10.5', updated: '6h ago', starred: false, tags: ['wifi'], notes: '' },
  { id: '10', name: 'SRV-BACKUP', type: 'Server', status: 'offline', location: 'DC-RACK-B1', owner: 'John Doe', ip: '10.0.1.20', updated: '5d ago', starred: false, tags: ['backup'], notes: 'Decommissioning in progress.' },
]

const ACME_PASSWORDS: PasswordEntry[] = [
  { id: '1', name: 'AWS Root Account', username: 'root@corp.com', password: 'Tr0ub4dor&3#Xk9!', category: 'Cloud', tags: ['aws', 'cloud', 'critical'], updated: '2026-06-01', strength: 'strong', starred: true, notes: 'Root account for AWS organization. MFA enforced.' },
  { id: '2', name: 'ESXi SRV-PROD-01', username: 'root', password: 'vMw@reR00t!2025', category: 'Hypervisor', tags: ['vmware', 'esxi', 'production'], updated: '2026-05-20', strength: 'strong', starred: true, notes: 'ESXi root access for primary hypervisor.' },
  { id: '3', name: 'FortiGate Admin', username: 'admin', password: 'F0rt1G@te!Edge01', category: 'Network', tags: ['fortinet', 'firewall'], updated: '2026-04-15', strength: 'strong', starred: false, notes: 'Web admin UI for perimeter firewall.' },
  { id: '4', name: 'Domain Admin (corp.local)', username: 'CORP\\Administrator', password: 'D0m@inAdm!n2025', category: 'Active Directory', tags: ['ad', 'domain', 'critical'], updated: '2026-03-01', strength: 'strong', starred: true, notes: 'Rotate every 90 days per policy.' },
  { id: '5', name: 'Azure Portal EA Admin', username: 'ea-admin@corp.onmicrosoft.com', password: 'Az@reEA2025!', category: 'Cloud', tags: ['azure', 'cloud'], updated: '2026-02-10', strength: 'medium', starred: false, notes: 'Enterprise Agreement portal admin.' },
  { id: '6', name: 'NAS QNAP Admin', username: 'admin', password: 'Qnap@NAS!2024', category: 'Storage', tags: ['nas', 'qnap', 'backup'], updated: '2026-01-20', strength: 'medium', starred: false, notes: 'NAS-BACKUP administrative access.' },
  { id: '7', name: 'VMware vCenter', username: 'administrator@vsphere.local', password: 'vSph3re!Admin25', category: 'Hypervisor', tags: ['vmware', 'vcenter'], updated: '2026-06-15', strength: 'strong', starred: false, notes: 'vCenter SSO admin.' },
]

const ACME_SUBNETS: Subnet[] = [
  { id: 's1', name: 'Corporate LAN', cidr: '10.0.0.0/24', vlan: 1, type: 'LAN', gateway: '10.0.0.1', dns: '10.0.0.53', description: 'Main corporate network.', ips: [
    { id: 'ip1', ip: '10.0.0.1', label: 'FW-EDGE-01', status: 'used', assetId: '6', notes: 'Perimeter firewall' },
    { id: 'ip2', ip: '10.0.0.2', label: 'SW-CORE-01', status: 'used', assetId: '7', notes: 'Core L3 switch' },
    { id: 'ip3', ip: '10.0.0.53', label: 'DNS Primary', status: 'reserved', notes: 'Internal DNS resolver' },
    { id: 'ip4', ip: '10.0.0.10', label: '', status: 'free', notes: '' },
  ]},
  { id: 's2', name: 'Server Farm', cidr: '10.0.1.0/24', vlan: 10, type: 'LAN', gateway: '10.0.1.1', dns: '10.0.0.53', description: 'Isolated subnet for production servers.', ips: [
    { id: 'ip6', ip: '10.0.1.10', label: 'SRV-PROD-01', status: 'used', assetId: '1', notes: 'Primary hypervisor' },
    { id: 'ip7', ip: '10.0.1.11', label: 'SRV-PROD-02', status: 'used', assetId: '2', notes: 'Secondary hypervisor' },
    { id: 'ip8', ip: '10.0.1.20', label: 'SRV-BACKUP', status: 'used', assetId: '10', notes: 'Decommissioning' },
  ]},
  { id: 's3', name: 'DMZ', cidr: '10.0.100.0/24', vlan: 100, type: 'DMZ', gateway: '10.0.100.1', dns: '8.8.8.8', description: 'Public-facing services.', ips: [
    { id: 'ip10', ip: '10.0.100.10', label: 'web-01.corp.local', status: 'used', notes: 'Nginx reverse proxy' },
    { id: 'ip11', ip: '10.0.100.11', label: 'mail.corp.local', status: 'used', notes: 'Postfix MTA' },
  ]},
]

const ACME_LICENSES: License[] = [
  { id: 'l1', name: 'Windows Server 2022 Datacenter', vendor: 'Microsoft', category: 'OS', type: 'Perpetual', seats: 4, seatsUsed: 4, purchaseDate: '2022-06-01', expiryDate: '2026-07-28', cost: 6155, currency: 'USD', licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', notes: 'Includes SA through 2027.', starred: false, status: 'expiring' },
  { id: 'l2', name: 'Microsoft 365 Business Premium', vendor: 'Microsoft', category: 'Office', type: 'Subscription', seats: 45, seatsUsed: 42, purchaseDate: '2024-01-01', expiryDate: '2027-01-01', cost: 11880, currency: 'USD', licenseKey: 'EA-2024-CORP-00142', notes: 'Annual commitment via CSP partner.', starred: true, status: 'active' },
  { id: 'l3', name: 'VMware vSphere 8 Enterprise Plus', vendor: 'Broadcom', category: 'Virtualization', type: 'Subscription', seats: 8, seatsUsed: 8, purchaseDate: '2024-03-01', expiryDate: '2026-09-01', cost: 4200, currency: 'USD', licenseKey: 'N/A - Broadcom portal', notes: 'Review alternatives.', starred: false, status: 'expiring' },
  { id: 'l4', name: 'FortiGate 100F UTM Bundle', vendor: 'Fortinet', category: 'Security', type: 'Subscription', seats: 1, seatsUsed: 1, purchaseDate: '2024-01-15', expiryDate: '2027-01-15', cost: 3800, currency: 'USD', licenseKey: 'FC1-10-PF100-811-02-36', notes: 'Includes IPS, AV, App Ctrl, URL Filtering.', starred: true, status: 'active' },
  { id: 'l5', name: 'Veeam Backup & Replication Enterprise', vendor: 'Veeam', category: 'Backup', type: 'Subscription', seats: 10, seatsUsed: 10, purchaseDate: '2023-04-01', expiryDate: '2027-04-01', cost: 5600, currency: 'USD', licenseKey: 'VBR-ENT-2023-XXXXX', notes: '10 socket bundle with production support.', starred: false, status: 'active' },
  { id: 'l6', name: 'Bitdefender GravityZone Business', vendor: 'Bitdefender', category: 'Antivirus', type: 'Subscription', seats: 50, seatsUsed: 47, purchaseDate: '2025-03-01', expiryDate: '2026-03-01', cost: 2200, currency: 'USD', licenseKey: 'GZ-BIZ-2025-XXXXX', notes: 'Endpoint protection for all workstations.', starred: false, status: 'expired' },
  { id: 'l7', name: 'PRTG Network Monitor XL5', vendor: 'Paessler', category: 'Monitoring', type: 'Perpetual', seats: 1, seatsUsed: 1, purchaseDate: '2021-08-01', expiryDate: '2099-01-01', cost: 10000, currency: 'USD', licenseKey: 'PRTG-XL5-XXXXXXXXXXXX', notes: 'Perpetual license up to 5000 sensors.', starred: true, status: 'active' },
]

const ACME_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Martin Novák', company: 'Fortinet CZ', role: 'Sales Representative', phone: '+420 777 123 456', email: 'martin.novak@fortinet.cz', description: 'Account manager for FortiGate renewals and new hardware quotes. Primary contact for all Fortinet licensing.', tags: ['fortinet', 'security'], starred: true },
  { id: 'c2', name: 'Jana Procházková', company: 'Microsoft CSP Partner', role: 'Partner Account Manager', phone: '+420 606 987 654', email: 'jana.prochazka@csppartner.cz', description: 'Handles our Microsoft 365 and Azure subscriptions through the CSP portal. Renewal contact for M365.', tags: ['microsoft', 'cloud', 'm365'], starred: true },
  { id: 'c3', name: 'Petr Svoboda', company: 'Veeam Software', role: 'Technical Account Manager', phone: '+420 724 456 789', email: 'p.svoboda@veeam.com', description: 'TAM for Veeam Backup & Replication. Contact for technical issues, licensing questions, and upgrades.', tags: ['veeam', 'backup'], starred: false },
  { id: 'c4', name: 'Alice Chen', company: 'Broadcom (VMware)', role: 'Enterprise Account Executive', phone: '+1 650 555 0102', email: 'alice.chen@broadcom.com', description: 'VMware vSphere account executive. Contact for vSphere licensing migration questions post-Broadcom acquisition.', tags: ['vmware', 'broadcom'], starred: false },
  { id: 'c5', name: 'Ondřej Král', company: 'DataCenter Services s.r.o.', role: 'Datacenter Manager', phone: '+420 602 111 222', email: 'o.kral@dc-services.cz', description: 'Responsible for physical rack space, power, and cooling in our colocation facility. 24/7 emergency contact.', tags: ['datacenter', 'colo'], starred: true },
]

const ACME_CONTRACTS: Contract[] = [
  { id: 'ct1', name: 'Datacenter Colocation Agreement', vendor: 'DataCenter Services s.r.o.', category: 'Lease', startDate: '2022-01-01', endDate: '2026-12-31', value: 36000, currency: 'CZK', autoRenew: true, notes: 'Annual lease for 4 rack units, 10A power. Includes remote hands 8h/month.', starred: true, status: 'active' },
  { id: 'ct2', name: 'IT Support SLA - Level 2', vendor: 'TechSupport Pro s.r.o.', category: 'SLA', startDate: '2024-04-01', endDate: '2026-03-31', value: 180000, currency: 'CZK', autoRenew: false, notes: '4h response time for critical incidents. 8h for standard. Includes 20 onsite visits per year.', starred: false, status: 'expiring' },
  { id: 'ct3', name: 'ISP Fiber Connectivity', vendor: 'O2 Czech Republic', category: 'Service', startDate: '2023-06-01', endDate: '2028-05-31', value: 48000, currency: 'CZK', autoRenew: true, notes: '1Gbps symmetric fiber, 99.9% SLA uptime. Backup: LTE fallback included.', starred: true, status: 'active' },
  { id: 'ct4', name: 'Hardware Maintenance - Dell', vendor: 'Dell Technologies', category: 'Maintenance', startDate: '2023-01-01', endDate: '2027-01-01', value: 12000, currency: 'USD', autoRenew: false, notes: 'ProSupport Plus for SRV-PROD-01 and SRV-PROD-02. Next business day onsite.', starred: false, status: 'active' },
]

const ACME_PLANS: Plan[] = [
  { id: 'p1', title: 'Migrate virtualization from VMware to Proxmox', description: 'Evaluate and plan migration of all production VMs from VMware vSphere 8 to Proxmox VE to reduce licensing costs after Broadcom acquisition. Estimated savings: $4,200/year.', priority: 'high', status: 'in-progress', targetDate: '2026-12-31', tags: ['vmware', 'proxmox', 'cost-saving'], createdAt: '2026-05-01' },
  { id: 'p2', title: 'Deploy new backup solution with cloud offload', description: 'Implement 3-2-1 backup strategy with cloud offload to Azure Blob Storage. Automate daily backups with 30-day retention and weekly full backups.', priority: 'high', status: 'planned', targetDate: '2026-09-30', tags: ['backup', 'azure', 'disaster-recovery'], createdAt: '2026-04-15' },
  { id: 'p3', title: 'Upgrade network core switch', description: 'Replace SW-CORE-01 (aging Cisco) with new Aruba 6300M for better performance and VLAN management. Budget approved Q3.', priority: 'medium', status: 'planned', targetDate: '2026-10-15', tags: ['network', 'switch', 'hardware'], createdAt: '2026-06-01' },
  { id: 'p4', title: 'Implement centralized log management (SIEM)', description: 'Deploy Wazuh or Graylog for centralized logging across all servers and network devices. Correlate events for security monitoring.', priority: 'medium', status: 'planned', targetDate: '2027-03-31', tags: ['siem', 'security', 'logging'], createdAt: '2026-06-10' },
  { id: 'p5', title: 'Refresh workstation fleet', description: 'Replace 12 workstations older than 5 years with new hardware. Includes Windows 11 Pro licenses. Budget request submitted to management.', priority: 'low', status: 'planned', targetDate: '2027-01-31', tags: ['workstation', 'hardware', 'refresh'], createdAt: '2026-07-01' },
]

const ACME_INCIDENTS: Incident[] = [
  { id: 'i1', title: 'Production database crash — SRV-PROD-01', severity: 'critical', status: 'closed', description: 'MySQL InnoDB data corruption on primary production server caused 2h 17min service outage. Root cause: disk I/O error on RAID controller due to failing write-back cache battery.', resolution: 'Replaced RAID controller battery. Restored from last clean backup (14h old). Implemented write-through cache as temporary measure. Scheduled full disk replacement window.', affectedSystems: ['SRV-PROD-01', 'Web Application', 'API Services'], occurredAt: '2026-04-12 03:14', resolvedAt: '2026-04-12 05:31', tags: ['database', 'hardware', 'outage'] },
  { id: 'i2', title: 'Perimeter firewall update failure', severity: 'high', status: 'closed', description: 'FortiOS upgrade from 7.4.3 to 7.4.4 failed mid-upgrade leaving FW-EDGE-01 in degraded state. Partial ruleset loaded, blocking some legitimate traffic.', resolution: 'Rolled back to 7.4.3 using TFTP recovery. Scheduled maintenance window for proper upgrade procedure with fallback plan.', affectedSystems: ['FW-EDGE-01', 'External connectivity'], occurredAt: '2026-03-08 22:00', resolvedAt: '2026-03-08 23:45', tags: ['firewall', 'upgrade', 'network'] },
  { id: 'i3', title: 'Ransomware detection on WS-DEV-42', severity: 'high', status: 'resolved', description: 'Bitdefender alerted on suspicious encryption behavior on developer workstation. User clicked phishing email attachment. Contained quickly before lateral movement.', resolution: 'Isolated machine immediately. Wiped and reimaged from clean backup. Enhanced email filtering rules deployed. User security awareness training completed.', affectedSystems: ['WS-DEV-42'], occurredAt: '2026-05-20 14:32', resolvedAt: '2026-05-20 17:00', tags: ['ransomware', 'phishing', 'endpoint'] },
  { id: 'i4', title: 'Core switch port flapping causing network instability', severity: 'medium', status: 'closed', description: 'SW-CORE-01 port 48 experiencing STP flapping causing intermittent packet loss across VLAN 1. Affected approx. 30% of users for ~45 minutes.', resolution: 'Disabled port 48, identified damaged SFP module. Replaced with spare. Enabled PortFast on access ports as preventive measure.', affectedSystems: ['SW-CORE-01', 'Corporate LAN'], occurredAt: '2026-06-02 09:15', resolvedAt: '2026-06-02 10:00', tags: ['network', 'switch', 'stp'] },
]

const ACME_KNOWLEDGE: KnowledgeArticle[] = [
  { id: 'kb1', title: 'Emergency Contacts & Escalation Path', category: 'Operations', content: '# Emergency Escalation\n\n## Level 1 — First Response\n- On-call admin: John Doe (+420 777 000 111)\n- Email: it-oncall@corp.local\n\n## Level 2 — Management\n- IT Manager: Sarah K. (+420 777 000 222)\n- CTO: Michael R. (+420 777 000 333)\n\n## External\n- Datacenter: Ondřej Král (+420 602 111 222)\n- ISP NOC: 800 123 456 (O2)', tags: ['emergency', 'escalation', 'contacts'], updatedAt: '2026-07-01', starred: true },
  { id: 'kb2', title: 'Backup & Recovery Procedures', category: 'Operations', content: '# Backup & Recovery\n\n## Backup Schedule\n- **Daily incremental**: 23:00 all production VMs\n- **Weekly full**: Sunday 01:00\n- **Retention**: 14 daily, 8 weekly, 3 monthly\n\n## Recovery Steps\n1. Open Veeam B&R console\n2. Navigate to Home > Backups\n3. Right-click VM > Restore > Instant VM Recovery\n4. Verify restore point timestamp\n5. Test in isolated network before cutover\n\n## RTO/RPO\n- Critical systems: RTO 4h / RPO 24h\n- Non-critical: RTO 24h / RPO 48h', tags: ['backup', 'recovery', 'veeam'], updatedAt: '2026-06-15', starred: true },
  { id: 'kb3', title: 'Network Diagram & VLAN Layout', category: 'Network', content: '# Network Overview\n\n## Core Infrastructure\n- **FW-EDGE-01**: Perimeter firewall, FortiGate 100F\n- **SW-CORE-01**: Core L3 switch, uplink to firewall\n\n## VLAN Structure\n| VLAN | Name | Subnet | Purpose |\n|------|------|--------|-------|\n| 1 | Corporate | 10.0.0.0/24 | Workstations, general |\n| 10 | Servers | 10.0.1.0/24 | Production servers |\n| 100 | DMZ | 10.0.100.0/24 | Public services |\n| 254 | MGMT | 10.0.254.0/24 | OOB management |', tags: ['network', 'vlan', 'diagram'], updatedAt: '2026-05-20', starred: false },
  { id: 'kb4', title: 'New User Onboarding Checklist', category: 'HR & Processes', content: '# New User Onboarding\n\n## Day 1\n- [ ] Create AD account (OU: Corp/Users)\n- [ ] Assign Microsoft 365 license\n- [ ] Set up workstation from image\n- [ ] Install required software\n- [ ] Add to appropriate security groups\n\n## Week 1\n- [ ] VPN access if needed\n- [ ] Email signature setup\n- [ ] Shared drive access\n- [ ] Security awareness training\n- [ ] IT policy acknowledgement form', tags: ['onboarding', 'hr', 'checklist'], updatedAt: '2026-04-10', starred: false },
]

const ACME_TASKS: Task[] = [
  { id: 't1', title: 'Renew Bitdefender GravityZone license', description: 'License expired 2026-03-01. Contact vendor for renewal quote. Budget approved up to $2,500 for 50 seats.', priority: 'high', status: 'todo', assignee: 'John Doe', dueDate: '2026-07-20', tags: ['license', 'antivirus'], createdAt: '2026-07-01' },
  { id: 't2', title: 'Replace failing UPS battery in DC-RACK-A', description: 'UPS runtime test shows 4 min remaining capacity (target: 15 min). Order APC APCRBC140 replacement battery.', priority: 'high', status: 'in-progress', assignee: 'Sarah K.', dueDate: '2026-07-18', tags: ['hardware', 'datacenter', 'ups'], createdAt: '2026-07-05' },
  { id: 't3', title: 'Update wildcard SSL certificate', description: '*.corp.local SSL cert expired June 2026. Generate new CSR, submit to DigiCert, deploy to all services.', priority: 'high', status: 'todo', assignee: 'John Doe', dueDate: '2026-07-15', tags: ['ssl', 'security', 'certificate'], createdAt: '2026-07-01' },
  { id: 't4', title: 'Document VMware to Proxmox migration plan', description: 'Write detailed migration runbook covering pre-migration checks, VM export/import procedures, rollback steps, and cutover window.', priority: 'medium', status: 'in-progress', assignee: 'Mike T.', dueDate: '2026-08-01', tags: ['proxmox', 'migration', 'documentation'], createdAt: '2026-06-15' },
  { id: 't5', title: 'Quarterly password rotation for shared accounts', description: 'Rotate passwords for: Domain Admin, vCenter, FortiGate, IPMI interfaces. Update Password Vault and notify relevant team members.', priority: 'medium', status: 'todo', assignee: 'John Doe', dueDate: '2026-08-01', tags: ['security', 'passwords'], createdAt: '2026-07-01' },
  { id: 't6', title: 'Review and update firewall ruleset', description: 'Audit FortiGate 100F ACL rules. Remove stale rules from old projects. Document remaining rules in Knowledge Base.', priority: 'low', status: 'todo', assignee: 'Sarah K.', dueDate: '2026-08-31', tags: ['firewall', 'security', 'audit'], createdAt: '2026-07-10' },
  { id: 't7', title: 'Setup monitoring alerts for disk usage', description: 'PRTG: add disk usage alerts for all servers at 80% warning, 90% critical. NAS-BACKUP is at 73% — priority.', priority: 'medium', status: 'done', assignee: 'Mike T.', dueDate: '2026-07-10', tags: ['monitoring', 'prtg'], createdAt: '2026-07-01' },
]

const BRANCH_ASSETS: Asset[] = [
  { id: 'b1', name: 'SRV-BRANCH-01', type: 'Server', status: 'online', location: 'Branch DC', owner: 'Lisa M.', ip: '192.168.1.10', updated: '1h ago', starred: true, tags: ['branch', 'production'], notes: 'Branch office file server.' },
  { id: 'b2', name: 'FW-BRANCH-01', type: 'Network', status: 'online', location: 'Branch DC', owner: 'Lisa M.', ip: '192.168.1.1', updated: '1h ago', starred: false, tags: ['network', 'firewall'], notes: 'FortiGate 60F for branch.' },
  { id: 'b3', name: 'WS-BRANCH-01', type: 'Workstation', status: 'online', location: 'Branch Office', owner: 'Tom W.', ip: '192.168.1.50', updated: '4h ago', starred: false, tags: ['workstation'], notes: '' },
]

const BRANCH_PASSWORDS: PasswordEntry[] = [
  { id: 'bp1', name: 'Branch FortiGate', username: 'admin', password: 'Br@nch!FW2025', category: 'Network', tags: ['firewall', 'branch'], updated: '2026-05-01', strength: 'strong', starred: false, notes: 'Branch office firewall admin.' },
  { id: 'bp2', name: 'NAS-BRANCH Admin', username: 'admin', password: 'Branch@NAS!24', category: 'Storage', tags: ['nas', 'branch'], updated: '2026-04-10', strength: 'medium', starred: false, notes: '' },
]

const BRANCH_SUBNETS: Subnet[] = [
  { id: 'bs1', name: 'Branch LAN', cidr: '192.168.1.0/24', vlan: 1, type: 'LAN', gateway: '192.168.1.1', dns: '192.168.1.1', description: 'Branch office main network.', ips: [
    { id: 'bip1', ip: '192.168.1.1', label: 'FW-BRANCH-01', status: 'used', assetId: 'b2', notes: 'Gateway/Firewall' },
    { id: 'bip2', ip: '192.168.1.10', label: 'SRV-BRANCH-01', status: 'used', assetId: 'b1', notes: 'File server' },
    { id: 'bip3', ip: '192.168.1.50', label: 'WS-BRANCH-01', status: 'used', assetId: 'b3', notes: '' },
  ]},
]

const BRANCH_LICENSES: License[] = [
  { id: 'bl1', name: 'Microsoft 365 Business Basic', vendor: 'Microsoft', category: 'Office', type: 'Subscription', seats: 8, seatsUsed: 8, purchaseDate: '2025-01-01', expiryDate: '2027-01-01', cost: 720, currency: 'USD', licenseKey: 'M365-BRANCH-XXXXX', notes: 'Branch office Microsoft 365 subscription.', starred: false, status: 'active' },
]

const ACME_GROUPS: Group[] = [
  { id: 'g1', name: 'Domain Admins', type: 'AD Security', description: 'Active Directory built-in group for domain administrators.', purpose: 'Full administrative control over the domain. Members can modify all AD objects, group policies, and domain settings.', members: ['Administrator', 'john.doe'], linkedAssets: ['1', '2'], tags: ['ad', 'critical', 'admin'], createdAt: '2022-01-01' },
  { id: 'g2', name: 'IT-Operations', type: 'AD Security', description: 'Security group for IT operations team members.', purpose: 'Grants access to server management consoles, monitoring systems, and helpdesk tools. Used for RBAC in PRTG and vCenter.', members: ['john.doe', 'sarah.k', 'mike.t'], linkedAssets: ['1', '2', '6', '7', '8'], tags: ['ad', 'it-team'], createdAt: '2022-03-15' },
  { id: 'g3', name: 'VPN-Users', type: 'AD Security', description: 'Users authorized to connect via VPN.', purpose: 'Mapped to FortiGate SSL VPN policy. Members receive split-tunnel access to internal resources during remote work.', members: ['john.doe', 'sarah.k', 'mike.t', 'lisa.m', 'tom.w'], linkedAssets: ['6'], tags: ['vpn', 'remote-access'], createdAt: '2022-06-01' },
  { id: 'g4', name: 'All-Staff', type: 'AD Distribution', description: 'Distribution group for all company employees.', purpose: 'Used for company-wide email announcements and communications. Managed by HR department.', members: ['all staff — 45 members'], linkedAssets: [], tags: ['email', 'distribution'], createdAt: '2022-01-01' },
  { id: 'g5', name: 'IT-Department', type: 'AD Distribution', description: 'Distribution group for IT department communications.', purpose: 'IT team mailing list for internal communications, alerts, and notifications.', members: ['john.doe', 'sarah.k', 'mike.t'], linkedAssets: [], tags: ['email', 'it-team'], createdAt: '2022-01-01' },
  { id: 'g6', name: 'OU=Servers,DC=corp,DC=local', type: 'AD OU', description: 'Organizational Unit containing all server computer objects.', purpose: 'GPOs for server hardening, Windows Update schedule, and audit policies are linked to this OU. Auto-enroll certificates.', members: ['SRV-PROD-01$', 'SRV-PROD-02$', 'SRV-DEV-01$', 'SRV-BACKUP$'], linkedAssets: ['1', '2', '3', '10'], tags: ['ad', 'gpo', 'servers'], createdAt: '2022-01-01' },
  { id: 'g7', name: 'Backup-Operators', type: 'Local Group', description: 'Local group on backup server for Veeam backup jobs.', purpose: 'Service account veeam-svc is member of this group on NAS-BACKUP. Required for VSS backup of production VMs without full admin rights.', members: ['veeam-svc'], linkedAssets: ['8'], tags: ['backup', 'veeam', 'service-account'], createdAt: '2023-05-01' },
]

const ACME_WARRANTY: WarrantyItem[] = [
  { id: 'w1', name: 'Dell PowerEdge R750 (SRV-PROD-01)', vendor: 'Dell Technologies', serialNumber: 'BCZK1234567', purchaseDate: '2022-01-15', warrantyEndDate: '2027-01-15', warrantyType: 'On-Site NBD', contactName: 'Dell ProSupport', contactPhone: '+1 800 945 3355', contactEmail: 'prosupport@dell.com', notes: 'ProSupport Plus plan. 5-year contract. Keep invoice PDF on file for claims.', assetId: '1', starred: true, status: 'active' },
  { id: 'w2', name: 'Dell PowerEdge R750 (SRV-PROD-02)', vendor: 'Dell Technologies', serialNumber: 'BCZK1234568', purchaseDate: '2022-01-15', warrantyEndDate: '2027-01-15', warrantyType: 'On-Site NBD', contactName: 'Dell ProSupport', contactPhone: '+1 800 945 3355', contactEmail: 'prosupport@dell.com', notes: 'Same contract as SRV-PROD-01.', assetId: '2', starred: false, status: 'active' },
  { id: 'w3', name: 'FortiGate 100F (FW-EDGE-01)', vendor: 'Fortinet', serialNumber: 'FG100F-HW-20230101', purchaseDate: '2023-01-15', warrantyEndDate: '2026-01-15', warrantyType: 'Standard', contactName: 'Fortinet TAC', contactPhone: '+1 408 235 7700', contactEmail: 'support@fortinet.com', notes: 'Hardware warranty only. UTM bundle subscription tracked separately in Licenses.', assetId: '6', starred: false, status: 'expired' },
  { id: 'w4', name: 'QNAP TS-1264U (NAS-BACKUP)', vendor: 'QNAP', serialNumber: 'Q12640001234', purchaseDate: '2022-08-01', warrantyEndDate: '2025-08-01', warrantyType: 'Carry-In', contactName: 'QNAP Support', contactPhone: '+886 2 2641 2000', contactEmail: 'support@qnap.com', notes: '3-year warranty expired. Extended support contract available.', assetId: '8', starred: false, status: 'expired' },
]

const ACME_DIAGRAM_NODES: DiagramNode[] = [
  { id: 'dn1', deviceType: 'internet', label: 'Internet', x: 400, y: 20, color: '#5c7080' },
  { id: 'dn2', deviceType: 'firewall', label: 'FW-EDGE-01\n10.0.0.1', ip: '10.0.0.1', assetId: '6', x: 400, y: 130 },
  { id: 'dn3', deviceType: 'switch', label: 'SW-CORE-01\n10.0.0.2', ip: '10.0.0.2', assetId: '7', x: 400, y: 250 },
  { id: 'dn4', deviceType: 'server', label: 'SRV-PROD-01\n10.0.1.10', ip: '10.0.1.10', assetId: '1', x: 200, y: 380 },
  { id: 'dn5', deviceType: 'server', label: 'SRV-PROD-02\n10.0.1.11', ip: '10.0.1.11', assetId: '2', x: 380, y: 380 },
  { id: 'dn6', deviceType: 'storage', label: 'NAS-BACKUP\n10.0.3.5', ip: '10.0.3.5', assetId: '8', x: 560, y: 380 },
  { id: 'dn7', deviceType: 'cloud', label: 'DMZ Zone\n10.0.100.0/24', x: 700, y: 250 },
  { id: 'dn8', deviceType: 'workstation', label: 'WS-ADMIN-01\n10.1.0.50', ip: '10.1.0.50', assetId: '4', x: 100, y: 500 },
]

const ACME_DIAGRAM_EDGES: DiagramEdge[] = [
  { id: 'de1', source: 'dn1', target: 'dn2', label: 'WAN', connectionType: 'wan' },
  { id: 'de2', source: 'dn2', target: 'dn3', label: '1G', connectionType: 'ethernet' },
  { id: 'de3', source: 'dn2', target: 'dn7', label: 'DMZ', connectionType: 'ethernet' },
  { id: 'de4', source: 'dn3', target: 'dn4', label: 'VLAN10', connectionType: 'ethernet' },
  { id: 'de5', source: 'dn3', target: 'dn5', label: 'VLAN10', connectionType: 'ethernet' },
  { id: 'de6', source: 'dn3', target: 'dn6', label: 'VLAN30', connectionType: 'ethernet' },
  { id: 'de7', source: 'dn3', target: 'dn8', label: 'VLAN1', connectionType: 'ethernet' },
]

const BRANCH_CONTACTS: Contact[] = [
  { id: 'bc1', name: 'Lisa Měřínská', company: 'Branch Office IT', role: 'IT Coordinator', phone: '+420 605 333 444', email: 'lisa.merinska@corp.local', description: 'Local IT coordinator for branch office. First point of contact for branch hardware issues.', tags: ['branch', 'internal'], starred: true },
]

const BRANCH_TASKS: Task[] = [
  { id: 'bt1', title: 'Install additional RAM in SRV-BRANCH-01', description: 'Server running at 85% memory utilization. Approved to upgrade from 32GB to 64GB DDR4 ECC.', priority: 'medium', status: 'todo', assignee: 'Lisa M.', dueDate: '2026-08-01', tags: ['hardware', 'branch'], createdAt: '2026-07-05' },
]

function emptyOrg(): OrgData {
  return { assets: [], passwords: [], subnets: [], licenses: [], contacts: [], contracts: [], plans: [], incidents: [], knowledgeArticles: [], tasks: [], groups: [], warrantyItems: [], diagramNodes: [], diagramEdges: [] }
}

const INITIAL_ORGS: Organization[] = [
  { id: 'org1', name: 'Acme Corp', color: '#2563eb', initials: 'AC', description: 'Headquarters — primary datacenter' },
  { id: 'org2', name: 'Branch Office', color: '#7c3aed', initials: 'BO', description: 'Branch location — secondary site' },
]

const INITIAL_ORG_DATA: Record<string, OrgData> = {
  org1: { assets: ACME_ASSETS, passwords: ACME_PASSWORDS, subnets: ACME_SUBNETS, licenses: ACME_LICENSES, contacts: ACME_CONTACTS, contracts: ACME_CONTRACTS, plans: ACME_PLANS, incidents: ACME_INCIDENTS, knowledgeArticles: ACME_KNOWLEDGE, tasks: ACME_TASKS, groups: ACME_GROUPS, warrantyItems: ACME_WARRANTY, diagramNodes: ACME_DIAGRAM_NODES, diagramEdges: ACME_DIAGRAM_EDGES },
  org2: { assets: BRANCH_ASSETS, passwords: BRANCH_PASSWORDS, subnets: BRANCH_SUBNETS, licenses: BRANCH_LICENSES, contacts: BRANCH_CONTACTS, contracts: [], plans: [], incidents: [], knowledgeArticles: [], tasks: BRANCH_TASKS, groups: [], warrantyItems: [], diagramNodes: [], diagramEdges: [] },
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

interface State { orgs: Organization[]; currentOrgId: string; orgData: Record<string, OrgData>; toasts: Toast[] }

type Action =
  | { type: 'SWITCH_ORG'; id: string }
  | { type: 'ADD_ORG'; org: Organization }
  | { type: 'ADD_ASSET'; orgId: string; asset: Asset }
  | { type: 'UPDATE_ASSET'; orgId: string; asset: Asset }
  | { type: 'DELETE_ASSET'; orgId: string; id: string }
  | { type: 'TOGGLE_STAR_ASSET'; orgId: string; id: string }
  | { type: 'ADD_PASSWORD'; orgId: string; password: PasswordEntry }
  | { type: 'UPDATE_PASSWORD'; orgId: string; password: PasswordEntry }
  | { type: 'DELETE_PASSWORD'; orgId: string; id: string }
  | { type: 'TOGGLE_STAR_PASSWORD'; orgId: string; id: string }
  | { type: 'ADD_SUBNET'; orgId: string; subnet: Subnet }
  | { type: 'UPDATE_SUBNET'; orgId: string; subnet: Subnet }
  | { type: 'DELETE_SUBNET'; orgId: string; id: string }
  | { type: 'ADD_IP'; orgId: string; subnetId: string; entry: IPEntry }
  | { type: 'UPDATE_IP'; orgId: string; subnetId: string; entry: IPEntry }
  | { type: 'DELETE_IP'; orgId: string; subnetId: string; entryId: string }
  | { type: 'ADD_LICENSE'; orgId: string; license: License }
  | { type: 'UPDATE_LICENSE'; orgId: string; license: License }
  | { type: 'DELETE_LICENSE'; orgId: string; id: string }
  | { type: 'TOGGLE_STAR_LICENSE'; orgId: string; id: string }
  | { type: 'ADD_CONTACT'; orgId: string; contact: Contact }
  | { type: 'UPDATE_CONTACT'; orgId: string; contact: Contact }
  | { type: 'DELETE_CONTACT'; orgId: string; id: string }
  | { type: 'TOGGLE_STAR_CONTACT'; orgId: string; id: string }
  | { type: 'ADD_CONTRACT'; orgId: string; contract: Contract }
  | { type: 'UPDATE_CONTRACT'; orgId: string; contract: Contract }
  | { type: 'DELETE_CONTRACT'; orgId: string; id: string }
  | { type: 'TOGGLE_STAR_CONTRACT'; orgId: string; id: string }
  | { type: 'ADD_PLAN'; orgId: string; plan: Plan }
  | { type: 'UPDATE_PLAN'; orgId: string; plan: Plan }
  | { type: 'DELETE_PLAN'; orgId: string; id: string }
  | { type: 'ADD_INCIDENT'; orgId: string; incident: Incident }
  | { type: 'UPDATE_INCIDENT'; orgId: string; incident: Incident }
  | { type: 'DELETE_INCIDENT'; orgId: string; id: string }
  | { type: 'ADD_KNOWLEDGE'; orgId: string; article: KnowledgeArticle }
  | { type: 'UPDATE_KNOWLEDGE'; orgId: string; article: KnowledgeArticle }
  | { type: 'DELETE_KNOWLEDGE'; orgId: string; id: string }
  | { type: 'TOGGLE_STAR_KNOWLEDGE'; orgId: string; id: string }
  | { type: 'ADD_TASK'; orgId: string; task: Task }
  | { type: 'UPDATE_TASK'; orgId: string; task: Task }
  | { type: 'DELETE_TASK'; orgId: string; id: string }
  | { type: 'ADD_GROUP'; orgId: string; group: Group }
  | { type: 'UPDATE_GROUP'; orgId: string; group: Group }
  | { type: 'DELETE_GROUP'; orgId: string; id: string }
  | { type: 'ADD_WARRANTY'; orgId: string; item: WarrantyItem }
  | { type: 'UPDATE_WARRANTY'; orgId: string; item: WarrantyItem }
  | { type: 'DELETE_WARRANTY'; orgId: string; id: string }
  | { type: 'TOGGLE_STAR_WARRANTY'; orgId: string; id: string }
  | { type: 'SAVE_DIAGRAM'; orgId: string; nodes: DiagramNode[]; edges: DiagramEdge[] }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }

function patchOrg(state: State, orgId: string, patch: (d: OrgData) => OrgData): State {
  return { ...state, orgData: { ...state.orgData, [orgId]: patch(state.orgData[orgId] ?? emptyOrg()) } }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SWITCH_ORG': return { ...state, currentOrgId: action.id }
    case 'ADD_ORG':    return { ...state, orgs: [...state.orgs, action.org], orgData: { ...state.orgData, [action.org.id]: emptyOrg() } }

    case 'ADD_ASSET':    return patchOrg(state, action.orgId, d => ({ ...d, assets: [action.asset, ...d.assets] }))
    case 'UPDATE_ASSET': return patchOrg(state, action.orgId, d => ({ ...d, assets: d.assets.map(a => a.id === action.asset.id ? action.asset : a) }))
    case 'DELETE_ASSET': return patchOrg(state, action.orgId, d => ({ ...d, assets: d.assets.filter(a => a.id !== action.id) }))
    case 'TOGGLE_STAR_ASSET': return patchOrg(state, action.orgId, d => ({ ...d, assets: d.assets.map(a => a.id === action.id ? { ...a, starred: !a.starred } : a) }))

    case 'ADD_PASSWORD':    return patchOrg(state, action.orgId, d => ({ ...d, passwords: [action.password, ...d.passwords] }))
    case 'UPDATE_PASSWORD': return patchOrg(state, action.orgId, d => ({ ...d, passwords: d.passwords.map(p => p.id === action.password.id ? action.password : p) }))
    case 'DELETE_PASSWORD': return patchOrg(state, action.orgId, d => ({ ...d, passwords: d.passwords.filter(p => p.id !== action.id) }))
    case 'TOGGLE_STAR_PASSWORD': return patchOrg(state, action.orgId, d => ({ ...d, passwords: d.passwords.map(p => p.id === action.id ? { ...p, starred: !p.starred } : p) }))

    case 'ADD_SUBNET':    return patchOrg(state, action.orgId, d => ({ ...d, subnets: [action.subnet, ...d.subnets] }))
    case 'UPDATE_SUBNET': return patchOrg(state, action.orgId, d => ({ ...d, subnets: d.subnets.map(s => s.id === action.subnet.id ? action.subnet : s) }))
    case 'DELETE_SUBNET': return patchOrg(state, action.orgId, d => ({ ...d, subnets: d.subnets.filter(s => s.id !== action.id) }))
    case 'ADD_IP':    return patchOrg(state, action.orgId, d => ({ ...d, subnets: d.subnets.map(s => s.id === action.subnetId ? { ...s, ips: [...s.ips, action.entry] } : s) }))
    case 'UPDATE_IP': return patchOrg(state, action.orgId, d => ({ ...d, subnets: d.subnets.map(s => s.id === action.subnetId ? { ...s, ips: s.ips.map(ip => ip.id === action.entry.id ? action.entry : ip) } : s) }))
    case 'DELETE_IP': return patchOrg(state, action.orgId, d => ({ ...d, subnets: d.subnets.map(s => s.id === action.subnetId ? { ...s, ips: s.ips.filter(ip => ip.id !== action.entryId) } : s) }))

    case 'ADD_LICENSE':    return patchOrg(state, action.orgId, d => ({ ...d, licenses: [action.license, ...d.licenses] }))
    case 'UPDATE_LICENSE': return patchOrg(state, action.orgId, d => ({ ...d, licenses: d.licenses.map(l => l.id === action.license.id ? action.license : l) }))
    case 'DELETE_LICENSE': return patchOrg(state, action.orgId, d => ({ ...d, licenses: d.licenses.filter(l => l.id !== action.id) }))
    case 'TOGGLE_STAR_LICENSE': return patchOrg(state, action.orgId, d => ({ ...d, licenses: d.licenses.map(l => l.id === action.id ? { ...l, starred: !l.starred } : l) }))

    case 'ADD_CONTACT':    return patchOrg(state, action.orgId, d => ({ ...d, contacts: [action.contact, ...d.contacts] }))
    case 'UPDATE_CONTACT': return patchOrg(state, action.orgId, d => ({ ...d, contacts: d.contacts.map(c => c.id === action.contact.id ? action.contact : c) }))
    case 'DELETE_CONTACT': return patchOrg(state, action.orgId, d => ({ ...d, contacts: d.contacts.filter(c => c.id !== action.id) }))
    case 'TOGGLE_STAR_CONTACT': return patchOrg(state, action.orgId, d => ({ ...d, contacts: d.contacts.map(c => c.id === action.id ? { ...c, starred: !c.starred } : c) }))

    case 'ADD_CONTRACT':    return patchOrg(state, action.orgId, d => ({ ...d, contracts: [action.contract, ...d.contracts] }))
    case 'UPDATE_CONTRACT': return patchOrg(state, action.orgId, d => ({ ...d, contracts: d.contracts.map(c => c.id === action.contract.id ? action.contract : c) }))
    case 'DELETE_CONTRACT': return patchOrg(state, action.orgId, d => ({ ...d, contracts: d.contracts.filter(c => c.id !== action.id) }))
    case 'TOGGLE_STAR_CONTRACT': return patchOrg(state, action.orgId, d => ({ ...d, contracts: d.contracts.map(c => c.id === action.id ? { ...c, starred: !c.starred } : c) }))

    case 'ADD_PLAN':    return patchOrg(state, action.orgId, d => ({ ...d, plans: [action.plan, ...d.plans] }))
    case 'UPDATE_PLAN': return patchOrg(state, action.orgId, d => ({ ...d, plans: d.plans.map(p => p.id === action.plan.id ? action.plan : p) }))
    case 'DELETE_PLAN': return patchOrg(state, action.orgId, d => ({ ...d, plans: d.plans.filter(p => p.id !== action.id) }))

    case 'ADD_INCIDENT':    return patchOrg(state, action.orgId, d => ({ ...d, incidents: [action.incident, ...d.incidents] }))
    case 'UPDATE_INCIDENT': return patchOrg(state, action.orgId, d => ({ ...d, incidents: d.incidents.map(i => i.id === action.incident.id ? action.incident : i) }))
    case 'DELETE_INCIDENT': return patchOrg(state, action.orgId, d => ({ ...d, incidents: d.incidents.filter(i => i.id !== action.id) }))

    case 'ADD_KNOWLEDGE':    return patchOrg(state, action.orgId, d => ({ ...d, knowledgeArticles: [action.article, ...d.knowledgeArticles] }))
    case 'UPDATE_KNOWLEDGE': return patchOrg(state, action.orgId, d => ({ ...d, knowledgeArticles: d.knowledgeArticles.map(a => a.id === action.article.id ? action.article : a) }))
    case 'DELETE_KNOWLEDGE': return patchOrg(state, action.orgId, d => ({ ...d, knowledgeArticles: d.knowledgeArticles.filter(a => a.id !== action.id) }))
    case 'TOGGLE_STAR_KNOWLEDGE': return patchOrg(state, action.orgId, d => ({ ...d, knowledgeArticles: d.knowledgeArticles.map(a => a.id === action.id ? { ...a, starred: !a.starred } : a) }))

    case 'ADD_TASK':    return patchOrg(state, action.orgId, d => ({ ...d, tasks: [action.task, ...d.tasks] }))
    case 'UPDATE_TASK': return patchOrg(state, action.orgId, d => ({ ...d, tasks: d.tasks.map(t => t.id === action.task.id ? action.task : t) }))
    case 'DELETE_TASK': return patchOrg(state, action.orgId, d => ({ ...d, tasks: d.tasks.filter(t => t.id !== action.id) }))

    case 'ADD_GROUP':    return patchOrg(state, action.orgId, d => ({ ...d, groups: [action.group, ...d.groups] }))
    case 'UPDATE_GROUP': return patchOrg(state, action.orgId, d => ({ ...d, groups: d.groups.map(g => g.id === action.group.id ? action.group : g) }))
    case 'DELETE_GROUP': return patchOrg(state, action.orgId, d => ({ ...d, groups: d.groups.filter(g => g.id !== action.id) }))

    case 'ADD_WARRANTY':    return patchOrg(state, action.orgId, d => ({ ...d, warrantyItems: [action.item, ...d.warrantyItems] }))
    case 'UPDATE_WARRANTY': return patchOrg(state, action.orgId, d => ({ ...d, warrantyItems: d.warrantyItems.map(w => w.id === action.item.id ? action.item : w) }))
    case 'DELETE_WARRANTY': return patchOrg(state, action.orgId, d => ({ ...d, warrantyItems: d.warrantyItems.filter(w => w.id !== action.id) }))
    case 'TOGGLE_STAR_WARRANTY': return patchOrg(state, action.orgId, d => ({ ...d, warrantyItems: d.warrantyItems.map(w => w.id === action.id ? { ...w, starred: !w.starred } : w) }))

    case 'SAVE_DIAGRAM': return patchOrg(state, action.orgId, d => ({ ...d, diagramNodes: action.nodes, diagramEdges: action.edges }))

    case 'ADD_TOAST':    return { ...state, toasts: [...state.toasts, action.toast] }
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }
    default: return state
  }
}

// ─── Context Value Type ───────────────────────────────────────────────────────

export interface AppContextValue {
  orgs: Organization[]; currentOrg: Organization; switchOrg: (id: string) => void; addOrg: (o: Omit<Organization, 'id'>) => void
  assets: Asset[]; passwords: PasswordEntry[]; subnets: Subnet[]; licenses: License[]
  contacts: Contact[]; contracts: Contract[]; plans: Plan[]; incidents: Incident[]
  knowledgeArticles: KnowledgeArticle[]; tasks: Task[]
  toasts: Toast[]; dismissToast: (id: string) => void; toast: (message: string, type?: Toast['type']) => void

  addAsset: (a: Omit<Asset, 'id' | 'updated'>) => void; updateAsset: (a: Asset) => void; deleteAsset: (id: string) => void; toggleStarAsset: (id: string) => void
  addPassword: (p: Omit<PasswordEntry, 'id' | 'updated' | 'strength'>) => void; updatePassword: (p: PasswordEntry) => void; deletePassword: (id: string) => void; toggleStarPassword: (id: string) => void
  addSubnet: (s: Omit<Subnet, 'id' | 'ips'>) => void; updateSubnet: (s: Subnet) => void; deleteSubnet: (id: string) => void
  addIPEntry: (subnetId: string, e: Omit<IPEntry, 'id'>) => void; updateIPEntry: (subnetId: string, e: IPEntry) => void; deleteIPEntry: (subnetId: string, entryId: string) => void
  addLicense: (l: Omit<License, 'id' | 'status'>) => void; updateLicense: (l: License) => void; deleteLicense: (id: string) => void; toggleStarLicense: (id: string) => void
  addContact: (c: Omit<Contact, 'id'>) => void; updateContact: (c: Contact) => void; deleteContact: (id: string) => void; toggleStarContact: (id: string) => void
  addContract: (c: Omit<Contract, 'id' | 'status'>) => void; updateContract: (c: Contract) => void; deleteContract: (id: string) => void; toggleStarContract: (id: string) => void
  addPlan: (p: Omit<Plan, 'id' | 'createdAt'>) => void; updatePlan: (p: Plan) => void; deletePlan: (id: string) => void
  addIncident: (i: Omit<Incident, 'id'>) => void; updateIncident: (i: Incident) => void; deleteIncident: (id: string) => void
  addKnowledge: (a: Omit<KnowledgeArticle, 'id' | 'updatedAt'>) => void; updateKnowledge: (a: KnowledgeArticle) => void; deleteKnowledge: (id: string) => void; toggleStarKnowledge: (id: string) => void
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void; updateTask: (t: Task) => void; deleteTask: (id: string) => void
  groups: Group[]; warrantyItems: WarrantyItem[]; diagramNodes: DiagramNode[]; diagramEdges: DiagramEdge[]
  addGroup: (g: Omit<Group, 'id' | 'createdAt'>) => void; updateGroup: (g: Group) => void; deleteGroup: (id: string) => void
  addWarranty: (w: Omit<WarrantyItem, 'id' | 'status'>) => void; updateWarranty: (w: WarrantyItem) => void; deleteWarranty: (id: string) => void; toggleStarWarranty: (id: string) => void
  saveDiagram: (nodes: DiagramNode[], edges: DiagramEdge[]) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcStrength(pw: string): PasswordStrength {
  if (pw.length >= 16 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) return 'strong'
  if (pw.length >= 10) return 'medium'
  return 'weak'
}

function calcLicenseStatus(expiryDate: string): LicenseStatus {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'expired'
  if (days <= 60) return 'expiring'
  return 'active'
}

function calcContractStatus(endDate: string): ContractStatus {
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'expired'
  if (days <= 60) return 'expiring'
  return 'active'
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { orgs: INITIAL_ORGS, currentOrgId: 'org1', orgData: INITIAL_ORG_DATA, toasts: [] })

  const currentOrg = state.orgs.find(o => o.id === state.currentOrgId) ?? state.orgs[0]
  const orgId = currentOrg.id
  const data = state.orgData[orgId] ?? emptyOrg()

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    if (!message) return
    const id = crypto.randomUUID()
    dispatch({ type: 'ADD_TOAST', toast: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3200)
  }, [])

  const dismissToast = useCallback((id: string) => dispatch({ type: 'REMOVE_TOAST', id }), [])
  const switchOrg = useCallback((id: string) => dispatch({ type: 'SWITCH_ORG', id }), [])
  const addOrg = useCallback((o: Omit<Organization, 'id'>) => {
    const org: Organization = { ...o, id: crypto.randomUUID() }
    dispatch({ type: 'ADD_ORG', org })
    toast(`Organization "${o.name}" created`)
  }, [toast])

  const addAsset = useCallback((a: Omit<Asset, 'id' | 'updated'>) => {
    dispatch({ type: 'ADD_ASSET', orgId, asset: { ...a, id: crypto.randomUUID(), updated: 'just now' } })
    toast(`Asset "${a.name}" created`)
  }, [orgId, toast])
  const updateAsset = useCallback((a: Asset) => { dispatch({ type: 'UPDATE_ASSET', orgId, asset: { ...a, updated: 'just now' } }); toast(`Asset "${a.name}" updated`) }, [orgId, toast])
  const deleteAsset = useCallback((id: string) => { const name = data.assets.find(a => a.id === id)?.name; dispatch({ type: 'DELETE_ASSET', orgId, id }); toast(`Asset "${name}" deleted`, 'info') }, [orgId, data.assets, toast])
  const toggleStarAsset = useCallback((id: string) => dispatch({ type: 'TOGGLE_STAR_ASSET', orgId, id }), [orgId])

  const addPassword = useCallback((p: Omit<PasswordEntry, 'id' | 'updated' | 'strength'>) => {
    dispatch({ type: 'ADD_PASSWORD', orgId, password: { ...p, id: crypto.randomUUID(), updated: new Date().toISOString().slice(0, 10), strength: calcStrength(p.password) } })
    toast(`Password "${p.name}" saved`)
  }, [orgId, toast])
  const updatePassword = useCallback((p: PasswordEntry) => { dispatch({ type: 'UPDATE_PASSWORD', orgId, password: { ...p, updated: new Date().toISOString().slice(0, 10), strength: calcStrength(p.password) } }); toast(`Password "${p.name}" updated`) }, [orgId, toast])
  const deletePassword = useCallback((id: string) => { const name = data.passwords.find(p => p.id === id)?.name; dispatch({ type: 'DELETE_PASSWORD', orgId, id }); toast(`Password "${name}" deleted`, 'info') }, [orgId, data.passwords, toast])
  const toggleStarPassword = useCallback((id: string) => dispatch({ type: 'TOGGLE_STAR_PASSWORD', orgId, id }), [orgId])

  const addSubnet = useCallback((s: Omit<Subnet, 'id' | 'ips'>) => { dispatch({ type: 'ADD_SUBNET', orgId, subnet: { ...s, id: crypto.randomUUID(), ips: [] } }); toast(`Subnet "${s.name}" added`) }, [orgId, toast])
  const updateSubnet = useCallback((s: Subnet) => { dispatch({ type: 'UPDATE_SUBNET', orgId, subnet: s }); toast(`Subnet "${s.name}" updated`) }, [orgId, toast])
  const deleteSubnet = useCallback((id: string) => { const name = data.subnets.find(s => s.id === id)?.name; dispatch({ type: 'DELETE_SUBNET', orgId, id }); toast(`Subnet "${name}" deleted`, 'info') }, [orgId, data.subnets, toast])
  const addIPEntry = useCallback((subnetId: string, e: Omit<IPEntry, 'id'>) => { dispatch({ type: 'ADD_IP', orgId, subnetId, entry: { ...e, id: crypto.randomUUID() } }); toast(`IP ${e.ip} added`) }, [orgId, toast])
  const updateIPEntry = useCallback((subnetId: string, e: IPEntry) => dispatch({ type: 'UPDATE_IP', orgId, subnetId, entry: e }), [orgId])
  const deleteIPEntry = useCallback((subnetId: string, entryId: string) => { dispatch({ type: 'DELETE_IP', orgId, subnetId, entryId }); toast('IP entry deleted', 'info') }, [orgId, toast])

  const addLicense = useCallback((l: Omit<License, 'id' | 'status'>) => { dispatch({ type: 'ADD_LICENSE', orgId, license: { ...l, id: crypto.randomUUID(), status: calcLicenseStatus(l.expiryDate) } }); toast(`License "${l.name}" added`) }, [orgId, toast])
  const updateLicense = useCallback((l: License) => { dispatch({ type: 'UPDATE_LICENSE', orgId, license: { ...l, status: calcLicenseStatus(l.expiryDate) } }); toast(`License "${l.name}" updated`) }, [orgId, toast])
  const deleteLicense = useCallback((id: string) => { const name = data.licenses.find(l => l.id === id)?.name; dispatch({ type: 'DELETE_LICENSE', orgId, id }); toast(`License "${name}" deleted`, 'info') }, [orgId, data.licenses, toast])
  const toggleStarLicense = useCallback((id: string) => dispatch({ type: 'TOGGLE_STAR_LICENSE', orgId, id }), [orgId])

  const addContact = useCallback((c: Omit<Contact, 'id'>) => { dispatch({ type: 'ADD_CONTACT', orgId, contact: { ...c, id: crypto.randomUUID() } }); toast(`Contact "${c.name}" added`) }, [orgId, toast])
  const updateContact = useCallback((c: Contact) => { dispatch({ type: 'UPDATE_CONTACT', orgId, contact: c }); toast(`Contact "${c.name}" updated`) }, [orgId, toast])
  const deleteContact = useCallback((id: string) => { const name = data.contacts.find(c => c.id === id)?.name; dispatch({ type: 'DELETE_CONTACT', orgId, id }); toast(`Contact "${name}" deleted`, 'info') }, [orgId, data.contacts, toast])
  const toggleStarContact = useCallback((id: string) => dispatch({ type: 'TOGGLE_STAR_CONTACT', orgId, id }), [orgId])

  const addContract = useCallback((c: Omit<Contract, 'id' | 'status'>) => { dispatch({ type: 'ADD_CONTRACT', orgId, contract: { ...c, id: crypto.randomUUID(), status: calcContractStatus(c.endDate) } }); toast(`Contract "${c.name}" added`) }, [orgId, toast])
  const updateContract = useCallback((c: Contract) => { dispatch({ type: 'UPDATE_CONTRACT', orgId, contract: { ...c, status: calcContractStatus(c.endDate) } }); toast(`Contract "${c.name}" updated`) }, [orgId, toast])
  const deleteContract = useCallback((id: string) => { const name = data.contracts.find(c => c.id === id)?.name; dispatch({ type: 'DELETE_CONTRACT', orgId, id }); toast(`Contract "${name}" deleted`, 'info') }, [orgId, data.contracts, toast])
  const toggleStarContract = useCallback((id: string) => dispatch({ type: 'TOGGLE_STAR_CONTRACT', orgId, id }), [orgId])

  const addPlan = useCallback((p: Omit<Plan, 'id' | 'createdAt'>) => { dispatch({ type: 'ADD_PLAN', orgId, plan: { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0, 10) } }); toast(`Plan "${p.title}" added`) }, [orgId, toast])
  const updatePlan = useCallback((p: Plan) => { dispatch({ type: 'UPDATE_PLAN', orgId, plan: p }); toast(`Plan "${p.title}" updated`) }, [orgId, toast])
  const deletePlan = useCallback((id: string) => { const title = data.plans.find(p => p.id === id)?.title; dispatch({ type: 'DELETE_PLAN', orgId, id }); toast(`Plan "${title}" deleted`, 'info') }, [orgId, data.plans, toast])

  const addIncident = useCallback((i: Omit<Incident, 'id'>) => { dispatch({ type: 'ADD_INCIDENT', orgId, incident: { ...i, id: crypto.randomUUID() } }); toast(`Incident "${i.title}" logged`) }, [orgId, toast])
  const updateIncident = useCallback((i: Incident) => { dispatch({ type: 'UPDATE_INCIDENT', orgId, incident: i }); toast(`Incident "${i.title}" updated`) }, [orgId, toast])
  const deleteIncident = useCallback((id: string) => { const title = data.incidents.find(i => i.id === id)?.title; dispatch({ type: 'DELETE_INCIDENT', orgId, id }); toast(`Incident "${title}" deleted`, 'info') }, [orgId, data.incidents, toast])

  const addKnowledge = useCallback((a: Omit<KnowledgeArticle, 'id' | 'updatedAt'>) => { dispatch({ type: 'ADD_KNOWLEDGE', orgId, article: { ...a, id: crypto.randomUUID(), updatedAt: new Date().toISOString().slice(0, 10) } }); toast(`Article "${a.title}" saved`) }, [orgId, toast])
  const updateKnowledge = useCallback((a: KnowledgeArticle) => { dispatch({ type: 'UPDATE_KNOWLEDGE', orgId, article: { ...a, updatedAt: new Date().toISOString().slice(0, 10) } }); toast(`Article "${a.title}" updated`) }, [orgId, toast])
  const deleteKnowledge = useCallback((id: string) => { const title = data.knowledgeArticles.find(a => a.id === id)?.title; dispatch({ type: 'DELETE_KNOWLEDGE', orgId, id }); toast(`Article "${title}" deleted`, 'info') }, [orgId, data.knowledgeArticles, toast])
  const toggleStarKnowledge = useCallback((id: string) => dispatch({ type: 'TOGGLE_STAR_KNOWLEDGE', orgId, id }), [orgId])

  const addTask = useCallback((t: Omit<Task, 'id' | 'createdAt'>) => { dispatch({ type: 'ADD_TASK', orgId, task: { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0, 10) } }); toast(`Task "${t.title}" added`) }, [orgId, toast])
  const updateTask = useCallback((t: Task) => { dispatch({ type: 'UPDATE_TASK', orgId, task: t }); toast(`Task "${t.title}" updated`) }, [orgId, toast])
  const deleteTask = useCallback((id: string) => { const title = data.tasks.find(t => t.id === id)?.title; dispatch({ type: 'DELETE_TASK', orgId, id }); toast(`Task "${title}" deleted`, 'info') }, [orgId, data.tasks, toast])

  const addGroup = useCallback((g: Omit<Group, 'id' | 'createdAt'>) => { dispatch({ type: 'ADD_GROUP', orgId, group: { ...g, id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0, 10) } }); toast(`Group "${g.name}" added`) }, [orgId, toast])
  const updateGroup = useCallback((g: Group) => { dispatch({ type: 'UPDATE_GROUP', orgId, group: g }); toast(`Group "${g.name}" updated`) }, [orgId, toast])
  const deleteGroup = useCallback((id: string) => { const name = data.groups.find(g => g.id === id)?.name; dispatch({ type: 'DELETE_GROUP', orgId, id }); toast(`Group "${name}" deleted`, 'info') }, [orgId, data.groups, toast])

  function calcWarrantyStatus(endDate: string): WarrantyStatus {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
    if (days < 0) return 'expired'
    if (days <= 60) return 'expiring'
    return 'active'
  }
  const addWarranty = useCallback((w: Omit<WarrantyItem, 'id' | 'status'>) => { dispatch({ type: 'ADD_WARRANTY', orgId, item: { ...w, id: crypto.randomUUID(), status: calcWarrantyStatus(w.warrantyEndDate) } }); toast(`Warranty "${w.name}" added`) }, [orgId, toast])
  const updateWarranty = useCallback((w: WarrantyItem) => { dispatch({ type: 'UPDATE_WARRANTY', orgId, item: { ...w, status: calcWarrantyStatus(w.warrantyEndDate) } }); toast(`Warranty "${w.name}" updated`) }, [orgId, toast])
  const deleteWarranty = useCallback((id: string) => { const name = data.warrantyItems.find(w => w.id === id)?.name; dispatch({ type: 'DELETE_WARRANTY', orgId, id }); toast(`Warranty "${name}" deleted`, 'info') }, [orgId, data.warrantyItems, toast])
  const toggleStarWarranty = useCallback((id: string) => dispatch({ type: 'TOGGLE_STAR_WARRANTY', orgId, id }), [orgId])

  const saveDiagram = useCallback((nodes: DiagramNode[], edges: DiagramEdge[]) => { dispatch({ type: 'SAVE_DIAGRAM', orgId, nodes, edges }) }, [orgId])

  const value: AppContextValue = {
    orgs: state.orgs, currentOrg, switchOrg, addOrg,
    assets: data.assets, passwords: data.passwords, subnets: data.subnets, licenses: data.licenses,
    contacts: data.contacts, contracts: data.contracts, plans: data.plans, incidents: data.incidents,
    knowledgeArticles: data.knowledgeArticles, tasks: data.tasks,
    groups: data.groups, warrantyItems: data.warrantyItems, diagramNodes: data.diagramNodes, diagramEdges: data.diagramEdges,
    toasts: state.toasts, dismissToast, toast,
    addAsset, updateAsset, deleteAsset, toggleStarAsset,
    addPassword, updatePassword, deletePassword, toggleStarPassword,
    addSubnet, updateSubnet, deleteSubnet, addIPEntry, updateIPEntry, deleteIPEntry,
    addLicense, updateLicense, deleteLicense, toggleStarLicense,
    addContact, updateContact, deleteContact, toggleStarContact,
    addContract, updateContract, deleteContract, toggleStarContract,
    addPlan, updatePlan, deletePlan,
    addIncident, updateIncident, deleteIncident,
    addKnowledge, updateKnowledge, deleteKnowledge, toggleStarKnowledge,
    addTask, updateTask, deleteTask,
    addGroup, updateGroup, deleteGroup,
    addWarranty, updateWarranty, deleteWarranty, toggleStarWarranty,
    saveDiagram,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
