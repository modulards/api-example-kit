export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);
  const type = getRouterParam(event, 'type');

  if (type !== 'woocommerce') {
    throw createError({ statusCode: 400, statusMessage: 'Expected "type" to be "woocommerce".' });
  }

  const body = (await readBody(event) ?? {}) as Record<string, unknown>;

  if (typeof body.status !== 'string' || !['active', 'inactive'].includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected "status" to be "active" or "inactive".' });
  }

  try {
    const { service } = await updateSiteServiceStatus(event, id, body.status as 'active' | 'inactive');
    return { service };
  } catch (e) {
    throw toH3Error(e);
  }
});
