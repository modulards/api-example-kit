import type { H3Event } from 'h3';
import { API_KEY_TOKEN_MAX_LENGTH } from '#shared/constants/api-keys';

function readTokenBody(body: unknown): string {
  const data = (body ?? {}) as Record<string, unknown>;

  if (typeof data.token !== 'string' || data.token.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid "token": expected a non-empty string.' });
  }

  const token = data.token.trim();

  if (token.length > API_KEY_TOKEN_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `The API key cannot be longer than ${API_KEY_TOKEN_MAX_LENGTH} characters.`,
    });
  }

  return token;
}

/** Tested before saving, so a rejected replacement keeps the current key. */
async function probeApiKey(event: H3Event, token: string): Promise<void> {
  await modularFetch<unknown>(event, { path: '/sites', query: { 'page[size]': '1' }, token });
}

export default defineEventHandler(async (event): Promise<{ saved: true }> => {
  const token = readTokenBody(await readBody(event));

  try {
    await probeApiKey(event, token);
  } catch (e) {
    if (e instanceof ModularApiError && (e.status === 401 || e.status === 403)) {
      throw createError({
        statusCode: e.status,
        statusMessage: 'The API rejected this key.',
        data: { code: 'invalid_api_key' },
      });
    }

    // Only a 401/403 means a bad key; a transport failure must not read as one.
    if (e instanceof ModularTransportError) {
      throw createError({
        statusCode: 502,
        statusMessage: 'The Modular DS API could not be reached to verify the key, so it was not saved.',
        data: { code: 'transport' },
      });
    }

    const error = toH3Error(e);

    if (e instanceof ModularApiError) {
      // Upstream details are dropped because they could echo the candidate key.
      const data = error.data as { code: string };
      error.data = { code: data.code };
    }

    throw error;
  }

  await setUserSession(event, { secure: { apiKey: token } });

  return { saved: true };
});
