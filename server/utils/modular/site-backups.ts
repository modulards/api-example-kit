import type { H3Event } from 'h3';
import type { CollectionDocument } from '#shared/types/jsonapi';
import type { Page, SiteBackup, SiteBackupAttributes } from '#shared/types/modular';

export const SITE_BACKUP_FIELDS = [
  'status',
  'attempts',
  'backup_type',
  'method',
  'size',
  'is_favorite',
  'restored_at',
  'comment',
  'created_at',
  'updated_at',
] as const satisfies readonly (keyof SiteBackupAttributes)[];

/**
 * The overview card only needs the newest five; `meta.total` still carries the full count.
 * @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-site-backups
 */
export async function fetchSiteBackups(event: H3Event, siteId: string): Promise<Page<SiteBackup>> {
  const query = toQuery({ sort: '-created_at', perPage: 5 });
  const { data } = await modularFetch<CollectionDocument<SiteBackupAttributes>>(event, {
    path: `/sites/${siteId}/backups`,
    query,
  });
  return toPage(data, (resource) => toDto(resource, SITE_BACKUP_FIELDS));
}
