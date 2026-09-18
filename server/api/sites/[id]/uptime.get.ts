export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  try {
    const { uptime } = await fetchSiteUptime(event, id);
    return { uptime };
  } catch (e) {
    throw toH3Error(e);
  }
});
