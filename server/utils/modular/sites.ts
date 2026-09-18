import type { H3Event } from 'h3';
import type { CollectionDocument, MetaDocument, ResourceObject, SingleDocument } from '#shared/types/jsonapi';
import type { Page, Site, SiteAttributes, Tag, TagAttributes, Team, TeamAttributes } from '#shared/types/modular';

export interface SitesListInput {
  q?: string;
  tags?: string[];
  team?: string[];
  connected?: boolean;
  page?: number;
}

export const TAG_FIELDS = [
  'name',
  'color',
  'order',
  'created_at',
  'updated_at',
] as const satisfies readonly (keyof TagAttributes)[];

export const TEAM_FIELDS = [
  'name',
  'slug',
  'created_at',
  'updated_at',
] as const satisfies readonly (keyof TeamAttributes)[];

function related<A>(resource: ResourceObject<unknown>, included: ResourceObject[], rel: string): ResourceObject<A>[] {
  const data = resource.relationships?.[rel]?.data;

  if (!data) {
    return [];
  }

  const identifiers = Array.isArray(data) ? data : [data];
  return identifiers.flatMap((identifier) => {
    const match = included.find((r) => r.type === identifier.type && r.id === identifier.id);
    return match ? [match as ResourceObject<A>] : [];
  });
}

// Generic because the maintenance and note endpoints answer with extra site attributes.
export function toSite<A extends SiteAttributes, K extends readonly (keyof A)[]>(
  resource: ResourceObject<A>,
  included: ResourceObject[] = [],
  fields: K = SITE_FIELDS as unknown as K,
): { team: Team | null; tags: Tag[] } & { id: string } & Pick<A, K[number]> {
  const team = related<TeamAttributes>(resource, included, 'team')[0];

  return {
    ...toDto(resource, fields),
    team: team ? toDto(team, TEAM_FIELDS) : null,
    tags: related<TagAttributes>(resource, included, 'tags').map((tag) => toDto(tag, TAG_FIELDS)),
  };
}

export const SITE_FIELDS = [
  'name',
  'slug',
  'provider',
  'connection_status',
  'is_connected',
  'connector_version',
  'scheme',
  'host',
  'display_host',
  'path',
  'uri',
  'synced_at',
  'core_version',
  'engine',
  'engine_version',
  'db_engine',
  'db_engine_version',
  'locale',
  'timezone',
  'ecommerce_engine',
  'ecommerce_version',
  'is_multisite',
  'is_main_site',
  'is_favorite',
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
] as const satisfies readonly (keyof SiteAttributes)[];

// The proxy's query params are named for the UI; the API has its own filter names.
function sitesFilter(input: Pick<SitesListInput, 'q' | 'tags' | 'team' | 'connected'>) {
  return {
    s: input.q,
    tags: input.tags,
    team: input.team,
    connected: input.connected,
  };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/list-sites */
export async function fetchSites(event: H3Event, input: SitesListInput = {}): Promise<{ page: Page<Site> }> {
  const query = toQuery({
    filter: sitesFilter(input),
    // Pinned so the first render is deterministic.
    sort: '-created_at',
    page: input.page,
    perPage: 50,
    include: ['team', 'tags'],
    fields: { sites: SITE_FIELDS },
  });
  const { data } = await modularFetch<CollectionDocument<SiteAttributes>>(event, { path: '/sites', query });
  return { page: toPage(data, (resource) => toSite(resource, data.included ?? [])) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/show-site */
export async function fetchSite(event: H3Event, id: string): Promise<{ site: Site }> {
  const query = toQuery({
    include: ['team', 'tags'],
    fields: { sites: SITE_FIELDS },
  });
  const { data } = await modularFetch<SingleDocument<SiteAttributes>>(event, { path: `/sites/${id}`, query });
  return { site: toSite(data.data, data.included ?? []) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/count-sites */
export async function countSites(event: H3Event, input: Omit<SitesListInput, 'page'> = {}): Promise<{ count: number }> {
  const query = toQuery({
    filter: sitesFilter(input),
  });
  const { data } = await modularFetch<MetaDocument<{ count: number }> & { meta: { count: number } }>(event, {
    path: '/sites/count',
    query,
  });
  return { count: data.meta.count };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/create-site */
export async function createSite(event: H3Event, input: CreateSiteInput): Promise<{ site: Site }> {
  const { data } = await modularFetch<SingleDocument<SiteAttributes>>(event, {
    path: '/sites',
    method: 'POST',
    body: input,
  });
  return { site: toSite(data.data, []) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site */
export async function updateSite(event: H3Event, id: string, input: UpdateSiteInput): Promise<{ site: Site }> {
  const { data } = await modularFetch<SingleDocument<SiteAttributes>>(event, {
    path: `/sites/${id}`,
    method: 'PATCH',
    body: input,
  });
  return { site: toSite(data.data, []) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/delete-site */
export async function deleteSite(event: H3Event, id: string): Promise<void> {
  await modularFetch(event, {
    path: `/sites/${id}`,
    method: 'DELETE',
  });
}
