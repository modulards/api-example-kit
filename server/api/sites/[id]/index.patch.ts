export default defineEventHandler(async (event): Promise<{ site: Site }> => {
  const id = readNumericRouteId(event);

  const body = (await readBody(event) ?? {}) as Record<string, unknown>;
  const input: UpdateSiteInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      throw createError({ statusCode: 400, statusMessage: 'Expected "name" to be a non-empty string.' });
    }

    if (body.name.trim().length > 60) {
      throw createError({ statusCode: 400, statusMessage: 'The site name cannot be longer than 60 characters.' });
    }

    input.name = body.name.trim();
  }

  if (body.team !== undefined) {
    if (typeof body.team !== 'number' || !Number.isSafeInteger(body.team) || body.team <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Expected "team" to be a positive integer.' });
    }

    input.team = body.team;
  }

  if (body.uri !== undefined) {
    if (typeof body.uri !== 'string' || body.uri.trim() === '') {
      throw createError({ statusCode: 400, statusMessage: 'Expected "uri" to be a non-empty string.' });
    }

    if (body.uri.trim().length > 250) {
      throw createError({ statusCode: 400, statusMessage: 'The site URL cannot be longer than 250 characters.' });
    }

    let parsedUri: URL;

    try {
      parsedUri = new URL(body.uri.trim());
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Expected "uri" to be a valid URL.' });
    }

    if (parsedUri.protocol !== 'http:' && parsedUri.protocol !== 'https:') {
      throw createError({ statusCode: 400, statusMessage: 'Expected "uri" to be an http(s) URL.' });
    }

    input.uri = body.uri.trim();
  }

  if (Object.keys(input).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one of name, team or uri is required.' });
  }

  try {
    const { site } = await updateSite(event, id, input);
    return { site };
  } catch (e) {
    throw toH3Error(e);
  }
});
