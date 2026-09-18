import { SITE_ACTION_ORIGINS, SITE_ACTION_STATUSES, SITE_ACTION_TYPES } from '#shared/constants/site-actions';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const input: SiteActionsListInput = {
    ids: readIdList(query.ids),
    site: readIdList(query.site),
    team: readIdList(query.team),
    tags: readIdList(query.tags),
    component: readOptionalString(query.component),
    type: readEnumList(query.type, SITE_ACTION_TYPES),
    status: readEnumList(query.status, SITE_ACTION_STATUSES),
    origin: readEnumList(query.origin, SITE_ACTION_ORIGINS),
    scheduled: readBooleanParam(query.scheduled),
    q: readOptionalString(query.q),
    page: readIntParam(query.page, { min: 1, fallback: 1 }),
  };

  try {
    const page = await fetchSiteActions(event, input);
    return { items: page.items, meta: page.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
