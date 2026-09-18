export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event, 'component');

  const body = (await readBody(event) ?? {}) as Record<string, unknown>;
  const sites = readSiteSelection(body.sites);

  try {
    const result = await uninstallComponent(event, id, { sites });
    setResponseStatus(event, 202);
    return { actions: result.actions, skipped: result.skipped };
  } catch (e) {
    throw toH3Error(e);
  }
});
