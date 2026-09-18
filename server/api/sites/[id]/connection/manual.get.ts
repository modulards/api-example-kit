export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  try {
    const connection = await fetchManualConnection(event, id);
    setResponseHeader(event, 'Cache-Control', 'no-store');
    return connection;
  } catch (e) {
    throw toH3Error(e);
  }
});
