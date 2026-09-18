import { SITE_ITEM_TYPES } from '#shared/constants/site-items';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const input: SiteItemHistoryListInput = {
    type: readEnumList(query.type, SITE_ITEM_TYPES),
    site: readIdList(query.site),
    siteItem: readOptionalString(query.siteItem),
    startedAt: readOptionalString(query.startedAt),
    endedAt: readOptionalString(query.endedAt),
    page: readIntParam(query.page, { min: 1, fallback: 1 }),
  };

  try {
    const page = await fetchSiteItemHistory(event, input);
    return { items: page.items, meta: page.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
