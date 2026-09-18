import type { H3Event } from 'h3';
import type { CollectionDocument } from '#shared/types/jsonapi';
import type { Page, SiteHealthCheck, SiteHealthCheckAttributes } from '#shared/types/modular';

export const SITE_HEALTH_FIELDS = [
  'type',
  'category',
  'status',
  'effective_status',
  'label',
  'description',
  'ignored_at',
  'created_at',
  'updated_at',
] as const satisfies readonly (keyof SiteHealthCheckAttributes)[];

/**
 * The overview card only needs the newest five; `meta.total` still carries the full count.
 * @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-site-health-checks
 */
export async function fetchSiteHealthChecks(event: H3Event, siteId: string): Promise<Page<SiteHealthCheck>> {
  const query = toQuery({ sort: '-created_at', perPage: 5 });
  const { data } = await modularFetch<CollectionDocument<SiteHealthCheckAttributes>>(event, {
    path: `/sites/${siteId}/health`,
    query,
  });
  return toPage(data, (resource) => toDto(resource, SITE_HEALTH_FIELDS));
}
