interface CreateTagBody { name: string; color: string }

// Format rules stay with the API, whose 422 the form shows per field.
function readCreateTagBody(body: unknown): CreateTagBody {
  const data = (body ?? {}) as Record<string, unknown>;

  if (typeof data.name !== 'string' || normalizeTagName(data.name) === '') {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid "name": expected a non-empty string.' });
  }

  if (typeof data.color !== 'string' || normalizeTagColor(data.color) === '') {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid "color": expected a non-empty string.' });
  }

  return { name: normalizeTagName(data.name), color: normalizeTagColor(data.color) };
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const input = readCreateTagBody(body);

  try {
    const { tag } = await createTag(event, input);
    setResponseStatus(event, 201);
    return { tag };
  } catch (e) {
    throw toH3Error(e);
  }
});
