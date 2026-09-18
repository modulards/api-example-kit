import type { H3Event } from 'h3';
import type { CollectionDocument } from '#shared/types/jsonapi';
import type {
  ComponentDto,
  ComponentAttributes,
  ComponentInstallInput,
  ComponentManageInput,
  ComponentUpgradeInput,
  ComponentsListInput,
  ManagerDispatchDocument,
  ManagerDispatchResult,
  SiteSelectionInput,
} from '#shared/types/modular';
import { toManagerDispatch } from './site-actions';

export const COMPONENT_FIELDS = [
  'slug',
  'name',
  'type',
  'url',
  'is_abandoned',
  'closed',
  'latest_version',
  'released_at',
  'days_since_release',
  'copilot_score',
  'vulnerabilities',
  'sites_total',
  'sites_updatable',
  'sites_active',
  'in_progress_actions',
] as const satisfies readonly (keyof ComponentAttributes)[];

function componentsFilter(input: ComponentsListInput) {
  return {
    s: input.q,
    type: input.type,
    site: input.site,
    team: input.team,
    tags: input.tags,
    update_available: input.updateAvailable,
    has_vulnerabilities: input.hasVulnerabilities,
    is_abandoned: input.isAbandoned,
    closed: input.closed,
  };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/components/list-components */
export async function fetchComponents(event: H3Event, input: ComponentsListInput = {}): Promise<Page<ComponentDto>> {
  const query = toQuery({
    filter: componentsFilter(input),
    sort: '-sites_updatable',
    page: input.page,
    perPage: 50,
    fields: { components: COMPONENT_FIELDS },
  });
  const { data } = await modularFetch<CollectionDocument<ComponentAttributes>>(event, {
    path: '/components',
    query,
  });
  return toPage(data, (resource) => toDto(resource, COMPONENT_FIELDS));
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/components/upgrade-component */
export async function upgradeComponent(event: H3Event, id: string, input: ComponentUpgradeInput): Promise<ManagerDispatchResult> {
  const { data } = await modularFetch<ManagerDispatchDocument>(event, {
    path: `/components/${id}/upgrade`,
    method: 'POST',
    body: input,
  });
  return toManagerDispatch(data);
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/components/manage-component */
export async function manageComponent(event: H3Event, id: string, input: ComponentManageInput): Promise<ManagerDispatchResult> {
  const { data } = await modularFetch<ManagerDispatchDocument>(event, {
    path: `/components/${id}/manage`,
    method: 'PATCH',
    body: input,
  });
  return toManagerDispatch(data);
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/components/uninstall-component */
export async function uninstallComponent(event: H3Event, id: string, input: SiteSelectionInput): Promise<ManagerDispatchResult> {
  const { data } = await modularFetch<ManagerDispatchDocument>(event, {
    path: `/components/${id}/uninstall`,
    method: 'POST',
    body: input,
  });
  return toManagerDispatch(data);
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/components/install-component */
export async function installComponent(event: H3Event, input: ComponentInstallInput): Promise<ManagerDispatchResult> {
  const { data } = await modularFetch<ManagerDispatchDocument>(event, {
    path: '/components/install',
    method: 'POST',
    body: input,
  });
  return toManagerDispatch(data);
}
