export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  try {
    await deleteSite(event, id);
    setResponseStatus(event, 204);
    return null;
  } catch (e) {
    throw toH3Error(e);
  }
});
