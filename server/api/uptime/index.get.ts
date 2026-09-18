import { UPTIME_STATUSES } from '#shared/constants/uptime';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const input: UptimePortfolioListInput = {
    status: readEnumList(query.status, UPTIME_STATUSES),
    page: readIntParam(query.page, { min: 1, fallback: 1 }),
  };

  try {
    const { page } = await fetchUptimePortfolio(event, input);
    return { items: page.items, meta: page.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
