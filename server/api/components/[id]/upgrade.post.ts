const ACTIONS = ['safe_upgrade', 'upgrade'] as const;

export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event, 'component');

  const body = (await readBody(event) ?? {}) as Record<string, unknown>;
  const sites = readSiteSelection(body.sites);

  const input: ComponentUpgradeInput = { sites };

  if (body.action !== undefined) {
    if (typeof body.action !== 'string' || !(ACTIONS as readonly string[]).includes(body.action)) {
      throw createError({ statusCode: 400, statusMessage: 'Expected "action" to be "safe_upgrade" or "upgrade".' });
    }

    input.action = body.action as (typeof ACTIONS)[number];
  }

  if (body.is_manual !== undefined) {
    if (input.action === 'upgrade') {
      throw createError({ statusCode: 400, statusMessage: '"is_manual" is only valid for safe upgrades.' });
    }

    if (typeof body.is_manual !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'Expected "is_manual" to be a boolean.' });
    }

    input.is_manual = body.is_manual;
  }

  if (body.clean_cache !== undefined) {
    if (typeof body.clean_cache !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'Expected "clean_cache" to be a boolean.' });
    }

    input.clean_cache = body.clean_cache;
  }

  if (body.scheduled_at !== undefined) {
    if (typeof body.scheduled_at !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'Expected "scheduled_at" to be an ISO date string.' });
    }

    const date = new Date(body.scheduled_at);

    if (Number.isNaN(date.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'Expected "scheduled_at" to be a parseable date.' });
    }

    if (date.getTime() <= Date.now()) {
      throw createError({ statusCode: 400, statusMessage: 'Expected "scheduled_at" to be in the future.' });
    }

    input.scheduled_at = body.scheduled_at;
  }

  try {
    const result = await upgradeComponent(event, id, input);
    setResponseStatus(event, 202);
    return { actions: result.actions, skipped: result.skipped };
  } catch (e) {
    throw toH3Error(e);
  }
});
