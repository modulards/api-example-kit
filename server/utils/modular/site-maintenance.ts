import type { H3Event } from 'h3';
import type { MaintenanceStatus } from '#shared/constants/maintenance';
import type { SingleDocument } from '#shared/types/jsonapi';
import type { SiteMaintenance, SiteMaintenanceAttributes } from '#shared/types/modular';

export const SITE_MAINTENANCE_FIELDS = [
  ...SITE_FIELDS,
  'maintenance_status',
  'maintenance_noindex',
  'maintenance_background',
  'maintenance_description',
  'maintenance_title',
] as const satisfies readonly (keyof SiteMaintenanceAttributes)[];

export interface SiteMaintenanceInput {
  status?: MaintenanceStatus;
  noindex?: boolean;
  background?: string;
  description?: string;
  title?: string;
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/show-site-maintenance */
export async function fetchSiteMaintenance(event: H3Event, siteId: string): Promise<{ maintenance: SiteMaintenance }> {
  const { data } = await modularFetch<SingleDocument<SiteMaintenanceAttributes>>(event, {
    path: `/sites/${siteId}/maintenance`,
  });
  return { maintenance: toSite(data.data, [], SITE_MAINTENANCE_FIELDS) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site-maintenance */
export async function updateSiteMaintenance(
  event: H3Event,
  siteId: string,
  input: SiteMaintenanceInput,
): Promise<{ maintenance: SiteMaintenance }> {
  const { data } = await modularFetch<SingleDocument<SiteMaintenanceAttributes>>(event, {
    path: `/sites/${siteId}/maintenance`,
    method: 'PATCH',
    // JSON.stringify drops `undefined` keys, so a partial input stays a partial PATCH.
    body: input,
  });
  return { maintenance: toSite(data.data, [], SITE_MAINTENANCE_FIELDS) };
}
