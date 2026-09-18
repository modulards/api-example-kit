const PRESETS = ['preset_uptime', 'preset_malware_scan', 'preset_broken_link', 'preset_backup'] as const;

export default defineEventHandler(async (event) => {
  const body = (await readBody(event) ?? {}) as Record<string, unknown>;

  if (typeof body.team !== 'number' || !Number.isSafeInteger(body.team) || body.team <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Expected "team" to be a positive integer.' });
  }

  const input: ConnectionPluginInput = { team: body.team };

  for (const preset of PRESETS) {
    const value = body[preset];

    if (value === undefined) {
      continue;
    }

    if (value === null) {
      input[preset] = null;
      continue;
    }

    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
      throw createError({ statusCode: 400, statusMessage: `Expected "${preset}" to be a positive integer or null.` });
    }

    input[preset] = value;
  }

  if (body.expires_at !== undefined) {
    if (typeof body.expires_at !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'Expected "expires_at" to be an ISO date string.' });
    }

    const date = new Date(body.expires_at);

    if (Number.isNaN(date.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'Expected "expires_at" to be a parseable date.' });
    }

    if (date.getTime() <= Date.now()) {
      throw createError({ statusCode: 400, statusMessage: 'Expected "expires_at" to be in the future.' });
    }

    const maxExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

    if (date.getTime() > maxExpiry) {
      throw createError({ statusCode: 400, statusMessage: 'Expected "expires_at" to be at most 7 days in the future.' });
    }

    input.expires_at = body.expires_at;
  }

  try {
    const plugin = await createConnectionPlugin(event, input);
    let archive: ArrayBuffer;

    try {
      // A presigned storage URL: the bearer token must not travel with it.
      const url = new URL(plugin.download_url);

      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('Invalid download URL');
      }

      const response = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      archive = await response.arrayBuffer();
    } catch {
      throw new ModularTransportError('Could not download the connection plugin.');
    }

    setResponseHeader(event, 'Cache-Control', 'no-store');
    setResponseHeader(event, 'Content-Type', 'application/zip');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="modular-connector.zip"');
    return send(event, Buffer.from(archive));
  } catch (e) {
    throw toH3Error(e);
  }
});
