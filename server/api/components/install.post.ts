const TYPES = ['plugin', 'theme'] as const;

export default defineEventHandler(async (event) => {
  const body = (await readBody(event) ?? {}) as Record<string, unknown>;
  const sites = readSiteSelection(body.sites);

  if (typeof body.type !== 'string' || !(TYPES as readonly string[]).includes(body.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected "type" to be "plugin" or "theme".' });
  }

  if (body.from !== 'repository') {
    throw createError({ statusCode: 400, statusMessage: 'Expected "from" to be "repository".' });
  }

  if (typeof body.value !== 'string' || body.value.trim() === '' || body.value.trim().length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Expected "value" to be a non-empty string of at most 200 characters.' });
  }

  const input: ComponentInstallInput = {
    sites,
    type: body.type as (typeof TYPES)[number],
    from: 'repository',
    value: body.value.trim(),
  };

  for (const field of ['activate', 'overwrite', 'clean_cache'] as const) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'boolean') {
        throw createError({ statusCode: 400, statusMessage: `Expected "${field}" to be a boolean.` });
      }

      input[field] = body[field];
    }
  }

  try {
    const result = await installComponent(event, input);
    setResponseStatus(event, 202);
    return { actions: result.actions, skipped: result.skipped };
  } catch (e) {
    throw toH3Error(e);
  }
});
