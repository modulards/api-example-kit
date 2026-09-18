export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event, 'component');

  const body = (await readBody(event) ?? {}) as Record<string, unknown>;
  const sites = readSiteSelection(body.sites);

  const ACTIONS = ['activate', 'deactivate'] as const;

  if (typeof body.action !== 'string' || !(ACTIONS as readonly string[]).includes(body.action)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected "action" to be "activate" or "deactivate".' });
  }

  const input: ComponentManageInput = { sites, action: body.action as (typeof ACTIONS)[number] };

  try {
    const result = await manageComponent(event, id, input);
    setResponseStatus(event, 202);
    return { actions: result.actions, skipped: result.skipped };
  } catch (e) {
    throw toH3Error(e);
  }
});
