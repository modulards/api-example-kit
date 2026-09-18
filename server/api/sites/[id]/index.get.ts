export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  try {
    const { site } = await fetchSite(event, id);
    return { site };
  } catch (e) {
    throw toH3Error(e);
  }
});
