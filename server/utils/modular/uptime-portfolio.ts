import type { H3Event } from 'h3';
import type { UptimeStatus } from '#shared/constants/uptime';
import type { CollectionDocument, ResourceObject } from '#shared/types/jsonapi';
import type { Page, SiteUptimeStatus, SiteUptimeStatusAttributes } from '#shared/types/modular';

export const UPTIME_PORTFOLIO_FIELDS = [
  'site',
  'enabled',
  'status',
  'status_since',
  'last_ping',
] as const satisfies readonly (keyof SiteUptimeStatusAttributes)[];

export function toUptimePortfolioStatus(
  resource: ResourceObject<SiteUptimeStatusAttributes>,
): SiteUptimeStatus {
  const status = toDto(resource, UPTIME_PORTFOLIO_FIELDS);

  return {
    ...status,
    site: {
      id: status.site.id,
      name: status.site.name,
    },
    last_ping: status.last_ping
      ? {
          at: status.last_ping.at,
          response_time_ms: status.last_ping.response_time_ms,
        }
      : status.last_ping,
  };
}

export interface UptimePortfolioListInput {
  status?: UptimeStatus[];
  page?: number;
}

/** Sends no sort: the default order is already worst-first. @see https://api.docs.modulards.com/modular-ds-public-api/uptime/list-uptime */
export async function fetchUptimePortfolio(
  event: H3Event,
  input: UptimePortfolioListInput = {},
): Promise<{ page: Page<SiteUptimeStatus> }> {
  const query = toQuery({ filter: { status: input.status }, page: input.page });
  const { data } = await modularFetch<CollectionDocument<SiteUptimeStatusAttributes>>(event, { path: '/uptime', query });
  return { page: toPage(data, toUptimePortfolioStatus) };
}
