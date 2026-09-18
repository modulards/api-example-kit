export default defineEventHandler(async (event): Promise<{ action: SiteAction }> => {
  const id = readNumericRouteId(event, 'site action');

  try {
    const { action } = await fetchSiteAction(event, id);
    return { action };
  } catch (e) {
    throw toH3Error(e);
  }
});
