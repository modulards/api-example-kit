import type { H3Event } from 'h3';
import type { CollectionDocument } from '#shared/types/jsonapi';
import type { Page, SiteScan, SiteScanAttributes } from '#shared/types/modular';

export const SITE_SCAN_FIELDS = [
  'method',
  'status',
  'verdict',
  'files_clean',
  'files_malicious',
  'files_suspicious',
  'files_infected',
  'db_threats_detected',
  'has_threats',
  'created_at',
  'updated_at',
] as const satisfies readonly (keyof SiteScanAttributes)[];

/**
 * The overview card only needs the newest five; `meta.total` still carries the full count.
 * @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-site-scans
 */
export async function fetchSiteScans(event: H3Event, siteId: string): Promise<Page<SiteScan>> {
  const query = toQuery({ sort: '-created_at', perPage: 5 });
  const { data } = await modularFetch<CollectionDocument<SiteScanAttributes>>(event, {
    path: `/sites/${siteId}/scans`,
    query,
  });
  return toPage(data, (resource) => toDto(resource, SITE_SCAN_FIELDS));
}
