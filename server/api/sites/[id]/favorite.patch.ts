export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  const body = (await readBody(event) ?? {}) as Record<string, unknown>;

  if (typeof body.favorite !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Expected "favorite" to be a boolean.' });
  }

  try {
    return await updateSiteFavorite(event, id, body.favorite);
  } catch (e) {
    throw toH3Error(e);
  }
});
