import type { H3Event } from 'h3';
import type { SingleDocument } from '#shared/types/jsonapi';
import type { Site, SiteAttributes } from '#shared/types/modular';

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site-tags */
export async function updateSiteTags(
  event: H3Event,
  id: string,
  input: { addTagIds: string[]; removeTagIds: string[] },
): Promise<{ site: Site }> {
  const { data } = await modularFetch<SingleDocument<SiteAttributes>>(event, {
    path: `/sites/${id}/tags`,
    method: 'PATCH',
    body: { add_tags: input.addTagIds, remove_tags: input.removeTagIds },
  });
  return { site: toSite(data.data, []) };
}
