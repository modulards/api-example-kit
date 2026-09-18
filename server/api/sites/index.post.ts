export default defineEventHandler(async (event): Promise<{ site: Site }> => {
  const body = (await readBody(event) ?? {}) as Record<string, unknown>;

  if (typeof body.name !== 'string' || body.name.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'Expected "name" to be a non-empty string.' });
  }

  if (body.name.trim().length > 60) {
    throw createError({ statusCode: 400, statusMessage: 'The site name cannot be longer than 60 characters.' });
  }

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

  if (typeof body.team !== 'number' || !Number.isSafeInteger(body.team) || body.team <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Expected "team" to be a positive integer.' });
  }

  const input: CreateSiteInput = {
    name: body.name.trim(),
    provider: 'wp',
    uri: body.uri.trim(),
    team: body.team,
  };

  try {
    const { site } = await createSite(event, input);
    setResponseStatus(event, 201);
    return { site };
  } catch (e) {
    throw toH3Error(e);
  }
});
