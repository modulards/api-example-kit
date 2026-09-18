export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  try {
    const { maintenance } = await fetchSiteMaintenance(event, id);
    return { maintenance };
  } catch (e) {
    throw toH3Error(e);
  }
});
