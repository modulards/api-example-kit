import type { H3Event } from 'h3';
import { createError } from 'h3';
import type { CollectionDocument, ResourceObject, SingleDocument } from '#shared/types/jsonapi';
import type {
  ManagerDispatchDocument,
  ManagerDispatchResult,
  Page,
  Site,
  SiteAction,
  SiteActionAttributes,
  SiteActionItemType,
  SiteActionsListInput,
  SiteActionStatus,
  SiteActionStep,
  VisualRegression,
} from '#shared/types/modular';

export const SITE_ACTION_LIST_FIELDS = [
  'type',
  'status',
  'origin',
  'site_id',
  'created_by',
  'started_at',
  'completed_at',
  'created_at',
  'updated_at',
  'requires_action',
  'scheduled_at',
  'managed_items',
] as const satisfies readonly (keyof SiteActionAttributes)[];

export const SITE_ACTION_DETAIL_FIELDS = [
  ...SITE_ACTION_LIST_FIELDS,
  'visual_regression',
] as const satisfies readonly (keyof SiteActionAttributes)[];
interface SiteRawAttributes {
  name?: string | null;
}

interface StepRawAttributes {
  type: SiteActionItemType;
  status: SiteActionStatus;
  priority: number | null;
  passive: boolean;
  available_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  attempts: number;
  created_at: string | null;
}

function projectSiteAction(
  resource: ResourceObject<SiteActionAttributes>,
  fields: readonly (keyof SiteActionAttributes)[],
): SiteAction {
  const action = toDto(resource, fields) as SiteAction;

  return {
    ...action,
    managed_items: action.managed_items?.map((item) => ({
      site_item_id: item.site_item_id,
      name: item.name,
      slug: item.slug,
      type: item.type,
      from_version: item.from_version,
      to_version: item.to_version,
    })),
    visual_regression: projectVisualRegression(action.visual_regression),
  };
}

function projectVisualRegression(
  visual: SiteActionAttributes['visual_regression'],
): VisualRegression | null | undefined {
  if (visual == null) {
    return visual;
  }

  return {
    change_percentage: visual.change_percentage,
    threshold: visual.threshold,
    success_path: visual.success_path,
    screenshots: {
      before: visual.screenshots.before,
      after: visual.screenshots.after,
      diff: visual.screenshots.diff,
    },
  };
}

export function toSiteAction(
  resource: ResourceObject<SiteActionAttributes>,
  included: ResourceObject[] = [],
  fields: readonly (keyof SiteActionAttributes)[] = SITE_ACTION_DETAIL_FIELDS,
): SiteAction {
  const base = projectSiteAction(resource, fields);
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

  const stepResources = included.filter((r) => r.type === 'site-action-items');
  const steps: SiteActionStep[] = stepResources.flatMap((step) => {
    if (!step.attributes) {
      return [];
    }

    const attributes = step.attributes as unknown as StepRawAttributes;
    return [{
      id: step.id,
      type: attributes.type,
      status: attributes.status,
      priority: attributes.priority,
      passive: attributes.passive,
      available_at: attributes.available_at,
      started_at: attributes.started_at,
      completed_at: attributes.completed_at,
      attempts: attributes.attempts,
      created_at: attributes.created_at,
    }];
  });

  return {
    ...base,
    site,
    ...(steps.length > 0 ? { steps } : {}),
  };
}

export function toManagerDispatch(document: ManagerDispatchDocument): ManagerDispatchResult {
  if (!document || !Array.isArray(document.data) || !document.meta || !Array.isArray(document.meta.skipped)) {
    throw createError({ statusCode: 502, statusMessage: 'Modular API returned an invalid dispatch response.' });
  }

  const actions = document.data.map((resource) => {
    const attributes = resource?.attributes as unknown as Record<string, unknown> | undefined;
    const actionId = resource?.id;

    if (
      typeof actionId !== 'string'
      || !/^[1-9]\d*$/.test(actionId)
      || !Number.isSafeInteger(Number(actionId))
      || !attributes
      || typeof attributes.type !== 'string'
      || typeof attributes.status !== 'string'
    ) {
      throw createError({ statusCode: 502, statusMessage: 'Modular API returned an invalid dispatch action.' });
    }

    return projectSiteAction(resource, SITE_ACTION_LIST_FIELDS);
  });

  return {
    actions,
    skipped: document.meta.skipped.map((site) => ({
      site_id: site.site_id,
      site_name: site.site_name,
      reason_code: site.reason_code,
      message: site.message,
    })),
  };
}

function siteActionsFilter(input: SiteActionsListInput) {
  return {
    id: input.ids,
    site: input.site,
    team: input.team,
    tags: input.tags,
    component: input.component,
    type: input.type,
    status: input.status,
    origin: input.origin,
    scheduled: input.scheduled,
    s: input.q,
  };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/site-actions/list-site-actions */
export async function fetchSiteActions(event: H3Event, input: SiteActionsListInput = {}): Promise<Page<SiteAction>> {
  const query = toQuery({
    filter: siteActionsFilter(input),
    sort: '-created_at',
    page: input.page,
    perPage: 50,
    include: ['site'],
    fields: {
      'site-actions': SITE_ACTION_LIST_FIELDS,
      'sites': ['name'],
    },
  });

  const { data } = await modularFetch<CollectionDocument<SiteActionAttributes>>(event, {
    path: '/site-actions',
    query,
  });

  return toPage(data, (resource) => toSiteAction(resource, data.included ?? [], SITE_ACTION_LIST_FIELDS));
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/site-actions/show-site-action */
export async function fetchSiteAction(event: H3Event, id: string): Promise<{ action: SiteAction }> {
  const query = toQuery({
    include: ['site', 'items'],
    fields: {
      'site-actions': SITE_ACTION_DETAIL_FIELDS,
      'sites': ['name'],
    },
  });

  const { data } = await modularFetch<SingleDocument<SiteActionAttributes>>(event, {
    path: `/site-actions/${id}`,
    query,
  });

  return { action: toSiteAction(data.data, data.included ?? []) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/site-actions/validate-site-action */
export async function validateSiteAction(
  event: H3Event,
  id: string,
  decision: 'approve' | 'rollback',
): Promise<{ action: SiteAction }> {
  const { data } = await modularFetch<SingleDocument<SiteActionAttributes>>(event, {
    path: `/site-actions/${id}/validate`,
    method: 'POST',
    body: { action: decision },
  });

  return { action: toSiteAction(data.data, data.included ?? []) };
}
