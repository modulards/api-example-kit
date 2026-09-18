export default defineEventHandler(async (event): Promise<{ item: SiteItem }> => {
  const id = readNumericRouteId(event, 'site item');

  try {
    const { item } = await fetchSiteItem(event, id);
    return { item };
  } catch (e) {
    throw toH3Error(e);
  }
});
