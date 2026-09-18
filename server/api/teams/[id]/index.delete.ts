export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event, 'team');

  try {
    await deleteTeam(event, id);
    setResponseStatus(event, 204);
    return null;
  } catch (e) {
    throw toH3Error(e);
  }
});
