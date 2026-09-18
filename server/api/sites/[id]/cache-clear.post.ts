export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  try {
    const { result } = await clearSiteCache(event, id);
    return { result };
  } catch (e) {
    throw toH3Error(e);
  }
});
