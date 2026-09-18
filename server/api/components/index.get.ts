import { SITE_ITEM_TYPES } from '#shared/constants/site-items';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const input: ComponentsListInput = {
    q: readOptionalString(query.q),
    type: readEnumList(query.type, SITE_ITEM_TYPES),
    site: readIdList(query.site),
    team: readIdList(query.team),
    tags: readIdList(query.tags),
    updateAvailable: readBooleanParam(query.updateAvailable),
    hasVulnerabilities: readBooleanParam(query.hasVulnerabilities),
    isAbandoned: readBooleanParam(query.isAbandoned),
    closed: readBooleanParam(query.closed),
    page: readIntParam(query.page, { min: 1, fallback: 1 }),
  };

  try {
    const page = await fetchComponents(event, input);
    return { items: page.items, meta: page.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
