export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  const body = await readBody(event);
  const addTagIds = readIdList(body?.addTagIds);
  const removeTagIds = readIdList(body?.removeTagIds);

  if (addTagIds.length === 0 && removeTagIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one of addTagIds or removeTagIds is required.' });
  }

  try {
    const { site } = await updateSiteTags(event, id, { addTagIds, removeTagIds });
    return { site };
  } catch (e) {
    throw toH3Error(e);
  }
});
