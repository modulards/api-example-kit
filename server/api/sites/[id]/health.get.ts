export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  try {
    const page = await fetchSiteHealthChecks(event, id);
    return { items: page.items, meta: page.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
