import type { H3Event } from 'h3';
import type { VulnerabilityComponentType, VulnerabilitySeverity } from '#shared/constants/vulnerabilities';
import type { CollectionDocument, ResourceObject } from '#shared/types/jsonapi';
import type { Page, SiteVulnerability, SiteVulnerabilityAttributes } from '#shared/types/modular';

export const VULNERABILITY_FIELDS = [
  'name',
  'description',
  'severity',
  'score',
  'affected_version_range',
  'unfixed',
  'discovered_at',
  'source_name',
  'source_url',
  'site',
  'component',
] as const satisfies readonly (keyof SiteVulnerabilityAttributes)[];

export function toSiteVulnerability(
  resource: ResourceObject<SiteVulnerabilityAttributes>,
): SiteVulnerability {
  const vulnerability = toDto(resource, VULNERABILITY_FIELDS);

  return {
    ...vulnerability,
    site: {
      id: vulnerability.site.id,
      name: vulnerability.site.name,
    },
    component: {
      id: vulnerability.component.id,
      name: vulnerability.component.name,
      type: vulnerability.component.type,
      slug: vulnerability.component.slug,
    },
  };
}

export interface VulnerabilitiesListInput {
  severity?: VulnerabilitySeverity[];
  componentType?: VulnerabilityComponentType[];
  page?: number;
}

/** Sends no sort: the default order is already worst-first. @see https://api.docs.modulards.com/modular-ds-public-api/vulnerabilities/list-vulnerabilities */
export async function fetchVulnerabilities(event: H3Event, input: VulnerabilitiesListInput = {}): Promise<Page<SiteVulnerability>> {
  const query = toQuery({
    filter: { severity: input.severity, component_type: input.componentType },
    page: input.page,
  });
  const { data } = await modularFetch<CollectionDocument<SiteVulnerabilityAttributes>>(event, {
    path: '/vulnerabilities',
    query,
  });
  return toPage(data, toSiteVulnerability);
}
