import type { H3Event } from 'h3';
import type { CollectionDocument, SingleDocument } from '#shared/types/jsonapi';
import type { Page, Team, TeamAttributes } from '#shared/types/modular';

export interface TeamsListInput {
  q?: string;
  ids?: string[];
  page?: number;
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/teams/list-teams */
export async function fetchTeams(event: H3Event, input: TeamsListInput = {}): Promise<{ page: Page<Team> }> {
  const query = toQuery({
    filter: { s: input.q, id: input.ids },
    sort: 'name',
    page: input.page,
    perPage: 50,
  });
  const { data } = await modularFetch<CollectionDocument<TeamAttributes>>(event, { path: '/teams', query });
  return { page: toPage(data, (resource) => toDto(resource, TEAM_FIELDS)) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/teams/show-team */
export async function fetchTeam(event: H3Event, id: string): Promise<{ team: Team }> {
  const { data } = await modularFetch<SingleDocument<TeamAttributes>>(event, { path: `/teams/${id}` });
  return { team: toDto(data.data, TEAM_FIELDS) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/teams/create-team */
export async function createTeam(event: H3Event, input: { name: string }): Promise<{ team: Team }> {
  const { data } = await modularFetch<SingleDocument<TeamAttributes>>(event, {
    path: '/teams',
    method: 'POST',
    body: { name: input.name.trim() },
  });
  return { team: toDto(data.data, TEAM_FIELDS) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/teams/update-team */
export async function updateTeam(event: H3Event, id: string, input: { name: string }): Promise<{ team: Team }> {
  const { data } = await modularFetch<SingleDocument<TeamAttributes>>(event, {
    path: `/teams/${id}`,
    method: 'PATCH',
    body: { name: input.name.trim() },
  });
  return { team: toDto(data.data, TEAM_FIELDS) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/teams/delete-team */
export async function deleteTeam(event: H3Event, id: string): Promise<void> {
  await modularFetch<undefined>(event, { path: `/teams/${id}`, method: 'DELETE' });
}
