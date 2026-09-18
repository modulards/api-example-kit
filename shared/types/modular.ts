import type { ResourceObject } from './jsonapi';
import type { SiteConnectionStatus } from '../constants/connection-status';
import type { MaintenanceStatus } from '../constants/maintenance';
import type { SITE_ACTION_ITEM_TYPES, SITE_ACTION_ORIGINS, SITE_ACTION_STATUSES, SITE_ACTION_TYPES } from '../constants/site-actions';
import type { SiteItemStatus, SiteItemType } from '../constants/site-items';
import type { UptimeAvailabilityWindowKey, UptimeStatus } from '../constants/uptime';
import type { VulnerabilityComponentType, VulnerabilitySeverity } from '../constants/vulnerabilities';

export interface SiteAttributes {
  name: string;
  slug: string | null;
  provider: string | null;
  connection_status: SiteConnectionStatus | null;
  is_connected: boolean;
  connector_version: string | null;
  scheme: string;
  host: string | null;
  display_host: string;
  path: string | null;
  uri: string;
  synced_at: string | null;
  core_version: string | null;
  engine: string | null;
  engine_version: string | null;
  db_engine: string | null;
  db_engine_version: string | null;
  locale: string | null;
  timezone: string | null;
  ecommerce_engine: string | null;
  ecommerce_version: string | null;
  is_multisite: boolean;
  is_main_site: boolean;
  is_favorite?: boolean;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  created_by: number | null;
}

export interface TagAttributes { name: string; color: string; order: number;
  created_at: string; updated_at: string; }
export interface TeamAttributes { name: string; slug: string;
  created_at: string; updated_at: string; }

export interface Tag extends TagAttributes { id: string }
export interface Team extends TeamAttributes { id: string }
export interface Site extends SiteAttributes {
  id: string;
  team?: Team | null;
  tags?: Tag[];
}

export interface Page<T> { items: T[]; meta: { currentPage: number; lastPage: number;
  perPage: number; total: number; }; }

export interface SiteItemAttributes {
  component_id: number | null;
  name: string | null;
  basename: string;
  slug: string | null;
  type: SiteItemType;
  status: SiteItemStatus | null;
  version: string | null;
  previous_version: string | null;
  new_version: string | null;
  is_hidden: boolean;
  has_error: boolean;
  vulnerabilities_exists: boolean | null;
  /** Critical or high. @see https://api.docs.modulards.com/modular-ds-public-api/site-items/list-site-items */
  vulnerabilities_c_exists: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  copilot_score?: number | null;
  released_at?: string | null;
  days_since_release?: number | null;
  in_progress_action_id?: number | null;
  in_progress_action_type?: string | null;
  in_progress_action_status?: SiteActionStatus | null;
  can_upgrade?: boolean | null;
  can_safe_upgrade?: boolean | null;
  can_activate?: boolean | null;
  can_deactivate?: boolean | null;
  can_delete?: boolean | null;
  last_error?: { code: string; message: string } | null;
}

export interface SiteItem extends SiteItemAttributes {
  id: string;
  site?: Pick<Site, 'id' | 'name'> | null;
}

export interface VulnerabilitySiteRef { id: number; name: string }
export interface VulnerabilityComponentRef {
  id: number;
  name: string;
  type: VulnerabilityComponentType;
  slug: string;
}

export interface SiteVulnerabilityAttributes {
  name: string;
  description: string | null;
  severity: VulnerabilitySeverity;
  /** @see https://api.docs.modulards.com/modular-ds-public-api/vulnerabilities/list-vulnerabilities */
  score: string | null;
  affected_version_range: string | null;
  unfixed: boolean;
  discovered_at: string | null;
  source_name: string | null;
  source_url: string | null;
  site: VulnerabilitySiteRef;
  component: VulnerabilityComponentRef;
}

export interface SiteVulnerability extends SiteVulnerabilityAttributes {
  /** @see https://api.docs.modulards.com/modular-ds-public-api/vulnerabilities/list-vulnerabilities */
  id: string;
}

export interface MaintenanceAttributes {
  maintenance_status: MaintenanceStatus | null;
  maintenance_noindex: boolean | null;
  maintenance_background: string | null;
  maintenance_description: string | null;
  maintenance_title: string | null;
}

export interface SiteMaintenanceAttributes extends SiteAttributes, MaintenanceAttributes {}
export interface SiteMaintenance extends Site, MaintenanceAttributes {}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site-note */
export interface NoteAttributes { note: string | null }

export interface SiteNoteAttributes extends SiteAttributes, NoteAttributes {}
export interface SiteNote extends Site, NoteAttributes {}

export interface UptimeLastPing {
  at: string | null;
  status: UptimeStatus | null;
  status_code: number | null;
  response_time_ms: number | null;
  error: string | null;
}

export interface UptimeAvailabilityWindow {
  percentage: number | null;
  total_pings: number;
}

export type UptimeAvailability = Record<UptimeAvailabilityWindowKey, UptimeAvailabilityWindow>;

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/show-site-uptime */
export interface SiteUptime {
  configured: boolean;
  enabled?: boolean | null;
  status?: UptimeStatus | null;
  status_since?: string | null;
  last_ping?: UptimeLastPing | null;
  availability?: UptimeAvailability | null;
  site_id: number;
}

export interface CacheClearResult { status: 'requested' }

export interface SiteCertificateAttributes {
  configured: boolean;
  enabled: boolean | null;
  ssl_status: 'up' | 'down' | 'unknown' | null;
  issuer: { cn: string | null; o: string | null; c: string | null; ou: string | null } | null;
  subject: { cn: string | null; o: string | null; c: string | null; ou: string | null } | null;
  valid_from: string | null;
  valid_to: string | null;
  days_until_expiry: number | null;
  protocol: string | null;
  sans: string[] | null;
}

export type SiteCertificate = SiteCertificateAttributes;

export interface UptimePortfolioSiteRef { id: number; name: string }

export interface UptimePortfolioLastPing {
  at: string | null;
  response_time_ms: number | null;
}

export interface SiteUptimeStatusAttributes {
  site: UptimePortfolioSiteRef;
  enabled: boolean;
  status: UptimeStatus;
  status_since: string | null;
  last_ping: UptimePortfolioLastPing | null;
}

export interface SiteUptimeStatus extends SiteUptimeStatusAttributes {
  /** The monitor's id; link to sites through `site.id`. @see https://api.docs.modulards.com/modular-ds-public-api/uptime/list-uptime */
  id: string;
}

export type SiteHealthStatus = 'good' | 'recommended' | 'critical';

export interface SiteHealthCheckAttributes {
  type: string;
  category: 'performance' | 'security';
  status: SiteHealthStatus;
  effective_status: SiteHealthStatus | null;
  label: string;
  /** Escaped HTML. @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-site-health-checks */
  description: string;
  ignored_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SiteHealthCheck extends SiteHealthCheckAttributes { id: string }

export interface SiteBackupAttributes {
  /** @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-site-backups */
  status: string;
  attempts: number;
  backup_type: string;
  method: string;
  size: number;
  is_favorite: boolean;
  restored_at: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SiteBackup extends SiteBackupAttributes { id: string }

export type BrokenLinkSeverity = 'error' | 'warning' | 'info';

export interface SiteBrokenLinkIssueAttributes {
  category: 'broken_link' | 'mixed_content';
  severity: BrokenLinkSeverity;
  target_url: string;
  http_status_code: number | null;
  is_internal: boolean | null;
  anchor_text: string | null;
  element_type: string | null;
  pages_count: number | null;
  last_checked_at: string | null;
  ignored_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SiteBrokenLinkIssue extends SiteBrokenLinkIssueAttributes { id: string }

export type SiteScanVerdict = 'pending' | 'in_progress' | 'clean' | 'threats_found' | 'failed' | 'quota_exceeded';

export interface SiteScanAttributes {
  method: string;
  status: string;
  /** @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-site-scans */
  verdict: SiteScanVerdict;
  files_clean: number;
  files_malicious: number;
  files_suspicious: number;
  files_infected: number;
  db_threats_detected: number;
  has_threats: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface SiteScan extends SiteScanAttributes { id: string }

export interface ComponentAttributes {
  slug: string | null;
  name: string | null;
  type: SiteItemType;
  url: string | null;
  is_abandoned: boolean;
  closed: boolean | null;
  latest_version?: string | null;
  released_at?: string | null;
  days_since_release?: number | null;
  copilot_score?: number | null;
  vulnerabilities?: number;
  sites_total?: number;
  sites_updatable?: number;
  sites_active?: number;
  in_progress_actions?: number;
}

export interface ComponentDto extends ComponentAttributes {
  id: string;
}

export interface SiteItemsSummaryCategory {
  total: number;
  updatable: number;
  has_vulnerabilities: number;
}

export interface SiteItemsSummary {
  plugin: SiteItemsSummaryCategory;
  theme: SiteItemsSummaryCategory;
  core: SiteItemsSummaryCategory;
  sites: {
    total: number;
    with_updates: number;
  };
}

export interface SiteItemHistoryAttributes {
  event: 'upgraded' | 'downgraded';
  from_version: string | null;
  to_version: string | null;
  created_at: string | null;
}

export interface SiteItemHistory extends SiteItemHistoryAttributes {
  id: string;
}

export interface ManagedItem {
  site_item_id: number | null;
  name: string | null;
  slug: string | null;
  type: string | null;
  from_version: string | null;
  to_version: string | null;
}

export interface VisualRegressionScreenshots {
  before: string | null;
  after: string | null;
  diff: string | null;
}

export interface VisualRegression {
  change_percentage: number | null;
  threshold: number;
  success_path: string;
  screenshots: VisualRegressionScreenshots;
}

export type SiteActionStatus = (typeof SITE_ACTION_STATUSES)[number];
export type SiteActionOrigin = (typeof SITE_ACTION_ORIGINS)[number];
export type SiteActionType = (typeof SITE_ACTION_TYPES)[number];
export type SiteActionItemType = (typeof SITE_ACTION_ITEM_TYPES)[number];

export interface SiteActionStep {
  id: string;
  type: SiteActionItemType;
  status: SiteActionStatus;
  priority: number | null;
  passive: boolean;
  available_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  attempts: number;
  created_at: string | null;
}

export interface SiteActionAttributes {
  type: SiteActionType;
  status: SiteActionStatus;
  origin: SiteActionOrigin | null;
  site_id: number | null;
  created_by: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  requires_action?: boolean;
  scheduled_at?: string | null;
  managed_items?: ManagedItem[];
  visual_regression?: VisualRegression | null;
}

export interface SiteAction extends SiteActionAttributes {
  id: string;
  site?: Pick<Site, 'id' | 'name'> | null;
  steps?: SiteActionStep[];
}

export type ManagerReasonCode
  = | 'SITE_UNREACHABLE'
    | 'CONNECTOR_OUTDATED'
    | 'UNSUPPORTED'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'INVALID_INPUT'
    | 'APPROVAL_REQUIRED'
    | 'TIMEOUT'
    | 'CONFLICT'
    | 'EXPIRED'
    | 'ALREADY_APPLIED';

export interface SkippedSite {
  site_id: number;
  site_name: string | null;
  reason_code: ManagerReasonCode;
  message: string;
}

export interface ManagerDispatchDocument {
  data: ResourceObject<SiteActionAttributes>[];
  meta: {
    skipped: SkippedSite[];
  };
  jsonapi?: {
    version: string;
  };
}

export interface ManagerDispatchResult {
  actions: SiteAction[];
  skipped: SkippedSite[];
}

export interface ManagerActionRequest {
  action: 'safe_upgrade' | 'upgrade' | 'activate' | 'deactivate' | 'uninstall';
  componentId: string;
  initialSiteIds: number[];
  initialSites?: { id: string; name: string }[];
}

export interface SiteSelectionInput {
  sites: number[];
}

export interface ComponentUpgradeInput extends SiteSelectionInput {
  action?: 'safe_upgrade' | 'upgrade';
  is_manual?: boolean;
  clean_cache?: boolean;
  scheduled_at?: string;
}

export interface ComponentManageInput extends SiteSelectionInput {
  action: 'activate' | 'deactivate';
}

export interface ComponentInstallInput extends SiteSelectionInput {
  type: 'plugin' | 'theme';
  from: 'repository';
  value: string;
  activate?: boolean;
  overwrite?: boolean;
  clean_cache?: boolean;
}

export interface CreateSiteInput {
  name: string;
  provider: 'wp';
  uri: string;
  team: number;
}

export interface UpdateSiteInput {
  name?: string;
  team?: number;
  uri?: string;
}

export interface SiteServiceStatus {
  id: string;
  service_type: 'woocommerce';
  service_status: 'active' | 'inactive';
  service_is_active: boolean;
  service_is_configured: boolean;
}

export interface ConnectionPluginInput {
  team: number;
  preset_uptime?: number | null;
  preset_malware_scan?: number | null;
  preset_broken_link?: number | null;
  preset_backup?: number | null;
  expires_at?: string;
}

export interface ConnectionPlugin {
  download_url: string;
  expires_at: string;
}

export interface ManualConnection {
  client_id: string | number;
  reveal_url: string;
  expires_at: string;
}

export interface ConnectionVerification {
  connection_status: SiteConnectionStatus;
  is_connected: boolean;
}

export interface ComponentsListInput {
  q?: string;
  type?: SiteItemType[];
  site?: string[];
  team?: string[];
  tags?: string[];
  updateAvailable?: boolean;
  hasVulnerabilities?: boolean;
  isAbandoned?: boolean;
  closed?: boolean;
  page?: number;
}

export interface SiteItemsListInput {
  q?: string;
  component?: string;
  site?: string[];
  team?: string[];
  tags?: string[];
  type?: SiteItemType[];
  status?: SiteItemStatus[];
  updateAvailable?: boolean;
  updatable?: boolean;
  hasVulnerabilities?: boolean;
  isHidden?: boolean;
  page?: number;
}

export interface SiteItemsSummaryInput {
  q?: string;
  component?: string;
  site?: string[];
  team?: string[];
  tags?: string[];
  type?: SiteItemType[];
  status?: SiteItemStatus[];
  updateAvailable?: boolean;
  updatable?: boolean;
  hasVulnerabilities?: boolean;
  isHidden?: boolean;
}

export interface SiteItemHistoryListInput {
  type?: SiteItemType[];
  site?: string[];
  siteItem?: string;
  startedAt?: string;
  endedAt?: string;
  page?: number;
}

export interface SiteActionsListInput {
  ids?: string[];
  site?: string[];
  team?: string[];
  tags?: string[];
  component?: string;
  type?: SiteActionType[];
  status?: SiteActionStatus[];
  origin?: SiteActionOrigin[];
  scheduled?: boolean;
  q?: string;
  page?: number;
}
