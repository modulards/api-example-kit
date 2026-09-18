import type { H3Event } from 'h3';
import type { SingleDocument } from '#shared/types/jsonapi';
import type { SiteNote, SiteNoteAttributes } from '#shared/types/modular';

export const SITE_NOTE_FIELDS = [
  ...SITE_FIELDS,
  'note',
] as const satisfies readonly (keyof SiteNoteAttributes)[];

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site-note */
export async function updateSiteNote(event: H3Event, siteId: string, note: string | null): Promise<{ site: SiteNote }> {
  const { data } = await modularFetch<SingleDocument<SiteNoteAttributes>>(event, {
    path: `/sites/${siteId}/notes`,
    method: 'PATCH',
    body: { note },
  });
  return { site: toSite(data.data, [], SITE_NOTE_FIELDS) };
}
