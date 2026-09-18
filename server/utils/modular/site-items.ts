import type { H3Event } from 'h3';
import { createError } from 'h3';
import type { CollectionDocument, MetaDocument, ResourceObject, SingleDocument } from '#shared/types/jsonapi';
import type {
  ManagerDispatchDocument,
  ManagerDispatchResult,
  Page,
  Site,
  SiteItem,
  SiteItemAttributes,
  SiteItemHistory,
  SiteItemHistoryAttributes,
  SiteItemHistoryListInput,
  SiteItemsListInput,
  SiteItemsSummary,
  SiteItemsSummaryCategory,
  SiteItemsSummaryInput,
  SiteSelectionInput,
} from '#shared/types/modular';

export const SITE_ITEM_LIST_FIELDS = [
  'component_id',
  'name',
  'basename',
  'slug',
  'type',
  'status',
  'version',
  'previous_version',
  'new_version',
  'is_hidden',
  'has_error',
  'vulnerabilities_exists',
  'vulnerabilities_c_exists',
  'created_at',
  'updated_at',
  'copilot_score',
  'released_at',
  'days_since_release',
  'in_progress_action_id',
  'in_progress_action_type',
  'in_progress_action_status',
  'can_upgrade',
  'can_safe_upgrade',
  'can_activate',
  'can_deactivate',
  'can_delete',
] as const satisfies readonly (keyof SiteItemAttributes)[];

export const SITE_ITEM_DETAIL_FIELDS = [
  ...SITE_ITEM_LIST_FIELDS,
  'last_error',
] as const satisfies readonly (keyof SiteItemAttributes)[];

export const SITE_ITEM_HISTORY_FIELDS = [
  'event',
  'from_version',
  'to_version',
  'created_at',
] as const satisfies readonly (keyof SiteItemHistoryAttributes)[];

interface SiteRawAttributes {
  name?: string | null;
}

function projectSiteItem<K extends readonly (keyof SiteItemAttributes)[]>(
  resource: ResourceObject<SiteItemAttributes>,
  fields: K,
): SiteItem {
  const item = toDto(resource, fields) as SiteItem;
  const lastError = item.last_error;

  return {
    ...item,
    last_error: lastError
      ? { code: lastError.code, message: lastError.message }
      : lastError,
  } as SiteItem;
}

export function toSiteItem(
  resource: ResourceObject<SiteItemAttributes>,
  included: ResourceObject[] = [],
  fields: readonly (keyof SiteItemAttributes)[] = SITE_ITEM_DETAIL_FIELDS,
): SiteItem {
  const base = projectSiteItem(resource, fields);

  const siteRelationship = resource.relationships?.site?.data;
  const siteRef = Array.isArray(siteRelationship) ? siteRelationship[0] : siteRelationship;
  let site: Pick<Site, 'id' | 'name'> | null = null;

  if (siteRef) {
    const match = included.find((r) => r.type === siteRef.type && r.id === siteRef.id);

    if (match) {
      const attrs = match.attributes as SiteRawAttributes | undefined;
      site = {
        id: match.id,
        name: attrs?.name ?? '',
      };
    }
  }

  return {
    ...base,
    site,
  };
}

function siteItemsFilter(input: SiteItemsListInput | SiteItemsSummaryInput) {
  return {
    s: input.q,
    component: input.component,
    site: input.site,
    team: input.team,
    tags: input.tags,
    type: input.type,
    status: input.status,
    update_available: input.updateAvailable,
    updatable: input.updatable,
    has_vulnerabilities: input.hasVulnerabilities,
    is_hidden: input.isHidden,
  };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/site-items/list-site-items */
export async function fetchSiteItems(event: H3Event, input: SiteItemsListInput = {}): Promise<Page<SiteItem>> {
  const query = toQuery({
    filter: siteItemsFilter(input),
    sort: 'name',
    page: input.page,
    perPage: 50,
    include: ['site'],
    fields: {
      'site-items': SITE_ITEM_LIST_FIELDS,
      'sites': ['name'],
    },
  });

  const { data } = await modularFetch<CollectionDocument<SiteItemAttributes>>(event, {
    path: '/site-items',
    query,
  });

  return toPage(data, (resource) => toSiteItem(resource, data.included ?? [], SITE_ITEM_LIST_FIELDS));
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/site-items/show-site-item */
export async function fetchSiteItem(event: H3Event, id: string): Promise<{ item: SiteItem }> {
  const query = toQuery({
    include: ['site'],
    fields: {
      'site-items': SITE_ITEM_DETAIL_FIELDS,
      'sites': ['name'],
    },
  });

  const { data } = await modularFetch<SingleDocument<SiteItemAttributes>>(event, {
    path: `/site-items/${id}`,
    query,
  });

  return { item: toSiteItem(data.data, data.included ?? []) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/site-items/summary */
export async function fetchSiteItemsSummary(event: H3Event, input: SiteItemsSummaryInput = {}): Promise<{ summary: SiteItemsSummary }> {
  const query = toQuery({
    filter: siteItemsFilter(input),
  });

  const { data } = await modularFetch<MetaDocument<SiteItemsSummary> & { meta: SiteItemsSummary }>(event, {
    path: '/site-items/summary',
    query,
  });

  const summary = data.meta;

  if (!summary || typeof summary !== 'object') {
    throw createError({ statusCode: 502, statusMessage: 'Modular API returned an invalid inventory summary response.' });
  }

  function projectCategory(category: SiteItemsSummaryCategory): SiteItemsSummaryCategory {
    return {
      total: category.total,
      updatable: category.updatable,
      has_vulnerabilities: category.has_vulnerabilities,
    };
  }

  return {
    summary: {
      plugin: projectCategory(summary.plugin),
      theme: projectCategory(summary.theme),
      core: projectCategory(summary.core),
      sites: {
        total: summary.sites.total,
        with_updates: summary.sites.with_updates,
      },
    },
  };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/site-items/history */
export async function fetchSiteItemHistory(event: H3Event, input: SiteItemHistoryListInput = {}): Promise<Page<SiteItemHistory>> {
  const query = toQuery({
    filter: {
      type: input.type,
      site: input.site,
      site_item: input.siteItem,
      started_at: input.startedAt,
      ended_at: input.endedAt,
    },
    sort: '-created_at',
    page: input.page,
    perPage: 50,
  });

  const { data } = await modularFetch<CollectionDocument<SiteItemHistoryAttributes>>(event, {
    path: '/site-items/history',
    query,
  });

  return toPage(data, (resource) => toDto(resource, SITE_ITEM_HISTORY_FIELDS));
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/site-items/sync-site-items */
export async function syncSiteItems(event: H3Event, input: SiteSelectionInput): Promise<ManagerDispatchResult> {
  const { data } = await modularFetch<ManagerDispatchDocument>(event, {
    path: '/site-items/sync',
    method: 'POST',
    body: { sites: input.sites },
  });

  return toManagerDispatch(data);
}
