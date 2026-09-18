import type { H3Event } from 'h3';
import { createError } from 'h3';
import type { SingleDocument } from '#shared/types/jsonapi';
import type { SiteAttributes } from '#shared/types/modular';

interface FavoriteDocument extends SingleDocument<SiteAttributes> {
  data: {
    id: string;
    type: string;
    attributes: SiteAttributes & { is_favorite: boolean };
  };
}

export const SITE_FAVORITE_FIELDS = [
  'is_favorite',
] as const satisfies readonly (keyof SiteAttributes)[];

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site-favorite */
export async function updateSiteFavorite(event: H3Event, id: string, favorite: boolean): Promise<{ favorite: boolean }> {
  const { data } = await modularFetch<FavoriteDocument>(event, {
    path: `/sites/${id}/favorite`,
    method: 'PATCH',
    body: { favorite },
  });

  const value = data.data?.attributes?.is_favorite;

  if (typeof value !== 'boolean') {
    throw createError({ statusCode: 502, statusMessage: 'Modular API returned an invalid favorite response.' });
  }

  return { favorite: value };
}
