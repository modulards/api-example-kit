import type { H3Event } from 'h3';
import type { CollectionDocument } from '#shared/types/jsonapi';
import type { Page, SiteBrokenLinkIssue, SiteBrokenLinkIssueAttributes } from '#shared/types/modular';

export const SITE_BROKEN_LINK_FIELDS = [
  'category',
  'severity',
  'target_url',
  'http_status_code',
  'is_internal',
  'anchor_text',
  'element_type',
  'pages_count',
  'last_checked_at',
  'ignored_at',
  'created_at',
  'updated_at',
] as const satisfies readonly (keyof SiteBrokenLinkIssueAttributes)[];

/**
 * The overview card only needs the newest five; `meta.total` still carries the full count.
 * @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-site-broken-links
 */
export async function fetchSiteBrokenLinks(event: H3Event, siteId: string): Promise<Page<SiteBrokenLinkIssue>> {
  const query = toQuery({ sort: '-created_at', perPage: 5 });
  const { data } = await modularFetch<CollectionDocument<SiteBrokenLinkIssueAttributes>>(event, {
    path: `/sites/${siteId}/broken-links`,
    query,
  });
  return toPage(data, (resource) => toDto(resource, SITE_BROKEN_LINK_FIELDS));
}
