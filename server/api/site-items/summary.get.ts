import { SITE_ITEM_STATUSES, SITE_ITEM_TYPES } from '#shared/constants/site-items';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const input: SiteItemsSummaryInput = {
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
  };

  try {
    const { summary } = await fetchSiteItemsSummary(event, input);
    return { summary };
  } catch (e) {
    throw toH3Error(e);
  }
});
