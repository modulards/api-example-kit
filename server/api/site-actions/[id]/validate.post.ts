const DECISIONS = ['approve', 'rollback'] as const;

export default defineEventHandler(async (event): Promise<{ action: SiteAction }> => {
  const id = readNumericRouteId(event, 'site action');

  const body = (await readBody(event) ?? {}) as Record<string, unknown>;

  if (typeof body.action !== 'string' || !(DECISIONS as readonly string[]).includes(body.action)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected "action" to be "approve" or "rollback".' });
  }

  try {
    const { action } = await validateSiteAction(event, id, body.action as 'approve' | 'rollback');
    return { action };
  } catch (e) {
    throw toH3Error(e);
  }
});
