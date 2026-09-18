import type { H3Event } from 'h3';
import { createError } from 'h3';
import type { MetaDocument } from '#shared/types/jsonapi';
import type { CacheClearResult } from '#shared/types/modular';

export const CACHE_CLEAR_FIELDS = [
  'status',
] as const satisfies readonly (keyof CacheClearResult)[];

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/clear-site-cache */
export async function clearSiteCache(event: H3Event, siteId: string): Promise<{ result: CacheClearResult }> {
  const { data } = await modularFetch<MetaDocument<CacheClearResult> & { meta: CacheClearResult }>(event, {
    path: `/sites/${siteId}/cache-clear`,
    method: 'POST',
  });

  if (!data.meta || typeof data.meta !== 'object') {
    throw createError({ statusCode: 502, statusMessage: 'Modular API returned an invalid cache response.' });
  }

  return { result: { status: data.meta.status } };
}
