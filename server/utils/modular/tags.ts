import type { H3Event } from 'h3';
import type { CollectionDocument, SingleDocument } from '#shared/types/jsonapi';
import type { Page, Tag, TagAttributes } from '#shared/types/modular';

export interface TagsListInput {
  q?: string;
  page?: number;
}

export function normalizeTagName(value: string): string {
  return value.trim();
}

export function normalizeTagColor(value: string): string {
  return value.trim();
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/tags/list-tags */
export async function fetchTags(event: H3Event, input: TagsListInput = {}): Promise<{ page: Page<Tag> }> {
  const query = toQuery({
    filter: { s: input.q },
    sort: 'order',
    page: input.page,
    perPage: 50,
  });
  const { data } = await modularFetch<CollectionDocument<TagAttributes>>(event, { path: '/tags', query });
  return { page: toPage(data, (resource) => toDto(resource, TAG_FIELDS)) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/tags/show-tag */
export async function fetchTag(event: H3Event, id: string): Promise<{ tag: Tag }> {
  const { data } = await modularFetch<SingleDocument<TagAttributes>>(event, { path: `/tags/${id}` });
  return { tag: toDto(data.data, TAG_FIELDS) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/tags/create-tag */
export async function createTag(event: H3Event, input: { name: string; color: string }): Promise<{ tag: Tag }> {
  const { data } = await modularFetch<SingleDocument<TagAttributes>>(event, {
    path: '/tags',
    method: 'POST',
    body: {
      name: normalizeTagName(input.name),
      color: normalizeTagColor(input.color),
    },
  });
  return { tag: toDto(data.data, TAG_FIELDS) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/tags/update-tag */
export async function updateTag(
  event: H3Event,
  id: string,
  input: { name?: string; color?: string; order?: number },
): Promise<{ tag: Tag }> {
  const { data } = await modularFetch<SingleDocument<TagAttributes>>(event, {
    path: `/tags/${id}`,
    method: 'PATCH',
    body: {
      ...(input.name === undefined ? {} : { name: normalizeTagName(input.name) }),
      ...(input.color === undefined ? {} : { color: normalizeTagColor(input.color) }),
      ...(input.order === undefined ? {} : { order: input.order }),
    },
  });
  return { tag: toDto(data.data, TAG_FIELDS) };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/tags/delete-tag */
export async function deleteTag(event: H3Event, id: string): Promise<void> {
  await modularFetch<undefined>(event, { path: `/tags/${id}`, method: 'DELETE' });
}
