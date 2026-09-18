import type { CollectionDocument, PaginationMeta, ResourceObject } from '#shared/types/jsonapi';
import type { Page } from '#shared/types/modular';

/** An allowlist, so attributes the API adds later never reach the browser unreviewed. */
export function toDto<A, K extends readonly (keyof A)[]>(
  resource: ResourceObject<A>,
  fields: K,
): { id: string } & Pick<A, K[number]> {
  const dto: Record<PropertyKey, unknown> = { id: resource.id };
  const attributes = resource.attributes;

  if (attributes) {
    for (const field of fields) {
      dto[field] = attributes[field];
    }
  }

  return dto as { id: string } & Pick<A, K[number]>;
}

export function toPage<A, T>(doc: CollectionDocument<A>, map: (resource: ResourceObject<A>) => T): Page<T> {
  return { items: doc.data.map(map), meta: pageMeta(doc.meta, doc.data.length) };
}

function pageMeta(meta: PaginationMeta | undefined, itemCount: number): Page<never>['meta'] {
  // A document without pagination meta still has to render, as a single page.
  if (meta?.current_page === undefined || meta?.total === undefined) {
    return { currentPage: 1, lastPage: 1, perPage: itemCount, total: itemCount };
  }

  return {
    currentPage: meta.current_page,
    lastPage: meta.last_page ?? 1,
    perPage: meta.per_page ?? itemCount,
    total: meta.total,
  };
}
