import { sentenceCase } from '#shared/utils/text';

// The badge tone and the sites filter work per group; the proxy expands a group into its statuses.
export const CONNECTED = ['established', 'maintaining'] as const;
export const CONNECTING = ['pending', 'restoring'] as const;
export const FAILED = [
  'lost',
  'unknown',
  'generic_error',
  'invalid_credentials',
  'invalid_login_uri',
  'captcha_detected',
  'maintenance_mode',
  'cannot_confirm',
  'cannot_plugin_installed',
  'minimum_version',
  'invalid_site_url',
  'client_error',
  'server_error',
  'plugin_not_found',
  'sites_limit_reached',
  'redirect_detected',
  'unauthorized',
] as const;
/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-sites */
export const INSTALLING = [
  'reached_login_page',
  'login_in',
  'logged_in',
  'reached_secondary_action_required',
  'reached_installation_page',
  'installing_plugin',
  'plugin_installed',
  'searching_plugin_upgrade',
  'plugin_upgrading',
  'plugin_upgraded',
  'reached_activation_page',
  'activating_plugin',
  'plugin_activated',
  'reached_credentials_page',
  'established_credentials',
] as const;

export const SITE_CONNECTION_STATUSES = [...CONNECTED, ...CONNECTING, ...FAILED, ...INSTALLING] as const;
export type SiteConnectionStatus = typeof SITE_CONNECTION_STATUSES[number];

type ConnectionStatusTone = 'success' | 'info' | 'error' | 'neutral';

export function connectionStatusTone(status: string | null): ConnectionStatusTone {
  if ((CONNECTED as readonly string[]).includes(status ?? '')) {
    return 'success';
  }

  if ((CONNECTING as readonly string[]).includes(status ?? '')) {
    return 'info';
  }

  if ((FAILED as readonly string[]).includes(status ?? '')) {
    return 'error';
  }

  return 'neutral';
}

const LABEL_OVERRIDES: Partial<Record<SiteConnectionStatus, string>> = {
  established: 'Connection established',
  lost: 'Connection lost',
  unknown: 'Unknown error',
  invalid_login_uri: 'Invalid login URL',
  invalid_site_url: 'Invalid site URL',
  cannot_confirm: 'Unconfirmed',
  cannot_plugin_installed: 'Failed to install the connector',
  minimum_version: 'Unsupported version',
  plugin_not_found: 'Connector not found',
  sites_limit_reached: 'Site limit reached',
};

export function connectionStatusLabel(status: string | null): string {
  if (status === null) {
    return 'No connection attempt';
  }

  return LABEL_OVERRIDES[status as SiteConnectionStatus] ?? sentenceCase(status);
}
