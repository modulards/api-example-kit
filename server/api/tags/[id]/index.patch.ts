interface UpdateTagBody { name?: string; color?: string; order?: number }

// Format rules stay with the API, whose 422 the form shows per field.
function readUpdateTagBody(body: unknown): UpdateTagBody {
  const data = (body ?? {}) as Record<string, unknown>;
  const hasName = data.name !== undefined;
  const hasColor = data.color !== undefined;
  const hasOrder = data.order !== undefined;

  if (!hasName && !hasColor && !hasOrder) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body: expected at least one of "name", "color", "order".' });
  }

  if (hasName && (typeof data.name !== 'string' || normalizeTagName(data.name) === '')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid "name": expected a non-empty string.' });
  }

  if (hasColor && (typeof data.color !== 'string' || normalizeTagColor(data.color) === '')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid "color": expected a non-empty string.' });
  }

  const result: UpdateTagBody = {};

  if (hasName) {
    result.name = normalizeTagName(data.name as string);
  }

  if (hasColor) {
    result.color = normalizeTagColor(data.color as string);
  }

  if (hasOrder) {
    result.order = readIntParam(data.order, { min: 1 });
  }

  return result;
}

export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event, 'tag');

  const body = await readBody(event);
  const input = readUpdateTagBody(body);

  try {
    const { tag } = await updateTag(event, id, input);
    return { tag };
  } catch (e) {
    throw toH3Error(e);
  }
});
