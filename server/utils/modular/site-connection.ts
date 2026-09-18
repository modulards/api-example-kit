import type { H3Event } from 'h3';
import type {
  ConnectionPlugin,
  ConnectionPluginInput,
  ConnectionVerification,
  ManualConnection,
} from '#shared/types/modular';

export const CONNECTION_PLUGIN_FIELDS = [
  'download_url',
  'expires_at',
] as const satisfies readonly (keyof ConnectionPlugin)[];

export const MANUAL_CONNECTION_FIELDS = [
  'client_id',
  'reveal_url',
  'expires_at',
] as const satisfies readonly (keyof ManualConnection)[];

export const CONNECTION_VERIFICATION_FIELDS = [
  'connection_status',
  'is_connected',
] as const satisfies readonly (keyof ConnectionVerification)[];

interface ConnectionPluginDocument {
  meta: ConnectionPlugin;
}

interface ManualConnectionDocument {
  meta: ManualConnection;
}

interface ConnectionVerificationDocument {
  meta: ConnectionVerification;
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/connection/create-connection-plugin */
export async function createConnectionPlugin(event: H3Event, input: ConnectionPluginInput): Promise<ConnectionPlugin> {
  const body: Record<string, unknown> = { team: input.team };

  for (const preset of ['preset_uptime', 'preset_malware_scan', 'preset_broken_link', 'preset_backup'] as const) {
    if (input[preset] !== undefined) {
      body[preset] = input[preset];
    }
  }

  if (input.expires_at !== undefined) {
    body.expires_at = input.expires_at;
  }

  const { data } = await modularFetch<ConnectionPluginDocument>(event, {
    path: '/connection-plugins',
    method: 'POST',
    body,
  });

  return {
    download_url: data.meta.download_url,
    expires_at: data.meta.expires_at,
  };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/connection/manual-connection-credentials */
export async function fetchManualConnection(event: H3Event, id: string): Promise<ManualConnection> {
  const { data } = await modularFetch<ManualConnectionDocument>(event, {
    path: `/sites/${id}/connection/manual`,
  });
  return {
    client_id: data.meta.client_id,
    reveal_url: data.meta.reveal_url,
    expires_at: data.meta.expires_at,
  };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/connection/verify-connection */
export async function verifySiteConnection(event: H3Event, id: string): Promise<ConnectionVerification> {
  const { data } = await modularFetch<ConnectionVerificationDocument>(event, {
    path: `/sites/${id}/connection/verify`,
    method: 'POST',
  });
  return {
    connection_status: data.meta.connection_status,
    is_connected: data.meta.is_connected,
  };
}
