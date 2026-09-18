export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event, 'tag');

  try {
    await deleteTag(event, id);
  } catch (e) {
    throw toH3Error(e);
  }

  setResponseStatus(event, 204);
  return null;
});
