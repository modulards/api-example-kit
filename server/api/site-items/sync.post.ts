export default defineEventHandler(async (event) => {
  const body = (await readBody(event) ?? {}) as Record<string, unknown>;

  const sites = readSiteSelection(body.sites);

  try {
    const result = await syncSiteItems(event, { sites });
    setResponseStatus(event, 202);
    return { actions: result.actions, skipped: result.skipped };
  } catch (e) {
    throw toH3Error(e);
  }
});
