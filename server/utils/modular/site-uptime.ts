import type { H3Event } from 'h3';
import { createError } from 'h3';
import { UPTIME_AVAILABILITY_WINDOWS } from '#shared/constants/uptime';
import type { MetaDocument } from '#shared/types/jsonapi';
import type { SiteUptime, UptimeAvailability, UptimeLastPing } from '#shared/types/modular';

export const SITE_UPTIME_FIELDS = [
  'configured',
  'enabled',
  'status',
  'status_since',
  'last_ping',
  'availability',
  'site_id',
] as const satisfies readonly (keyof SiteUptime)[];

function projectLastPing(ping: UptimeLastPing | null | undefined): UptimeLastPing | null | undefined {
  if (!ping) {
    return ping;
  }

  return {
    at: ping.at,
    status: ping.status,
    status_code: ping.status_code,
    response_time_ms: ping.response_time_ms,
    error: ping.error,
  };
}

function projectAvailability(
  availability: UptimeAvailability | null | undefined,
): UptimeAvailability | null | undefined {
  if (!availability) {
    return availability;
  }

  const projected = {} as UptimeAvailability;

  for (const window of UPTIME_AVAILABILITY_WINDOWS) {
    const measure = availability[window];
    projected[window] = {
      percentage: measure.percentage,
      total_pings: measure.total_pings,
    };
  }

  return projected;
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/show-site-uptime */
export async function fetchSiteUptime(event: H3Event, siteId: string): Promise<{ uptime: SiteUptime }> {
  const { data } = await modularFetch<MetaDocument<SiteUptime> & { meta: SiteUptime }>(event, { path: `/sites/${siteId}/uptime` });
  const meta = data.meta;

  if (!meta || typeof meta !== 'object') {
    throw createError({ statusCode: 502, statusMessage: 'Modular API returned an invalid uptime response.' });
  }

  return {
    uptime: {
      configured: meta.configured,
      enabled: meta.enabled,
      status: meta.status,
      status_since: meta.status_since,
      last_ping: projectLastPing(meta.last_ping),
      availability: projectAvailability(meta.availability),
      site_id: meta.site_id,
    },
  };
}
