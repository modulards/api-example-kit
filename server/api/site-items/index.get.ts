import { SITE_ITEM_STATUSES, SITE_ITEM_TYPES } from '#shared/constants/site-items';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const input: SiteItemsListInput = {
    q: readOptionalString(query.q),
    component: readOptionalString(query.component),
    site: readIdList(query.site),
    team: readIdList(query.team),
    tags: readIdList(query.tags),
    type: readEnumList(query.type, SITE_ITEM_TYPES),
    status: readEnumList(query.status, SITE_ITEM_STATUSES),
    updateAvailable: readBooleanParam(query.updateAvailable),
    updatable: readBooleanParam(query.updatable),
    hasVulnerabilities: readBooleanParam(query.hasVulnerabilities),
    isHidden: readBooleanParam(query.isHidden),
    page: readIntParam(query.page, { min: 1, fallback: 1 }),
  };

  try {
    const page = await fetchSiteItems(event, input);
    return { items: page.items, meta: page.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
