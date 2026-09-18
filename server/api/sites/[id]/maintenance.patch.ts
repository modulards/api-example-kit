import {
  MAINTENANCE_BACKGROUND_PATTERN,
  MAINTENANCE_DESCRIPTION_MAX_LENGTH,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TITLE_MAX_LENGTH,
} from '#shared/constants/maintenance';

// Only sent keys are forwarded: resending the customization fields can fail for a caller allowed
// to toggle the status alone.
function readMaintenanceBody(body: unknown): SiteMaintenanceInput {
  const data = (body ?? {}) as Record<string, unknown>;
  const result: SiteMaintenanceInput = {};

  if (data.status !== undefined) {
    const statuses = readEnumList(data.status, MAINTENANCE_STATUSES);

    if (statuses.length !== 1 || !statuses[0]) {
      throw createError({ statusCode: 400, statusMessage: `Invalid "status": expected one of ${MAINTENANCE_STATUSES.join(', ')}.` });
    }

    result.status = statuses[0];
  }

  if (data.noindex !== undefined) {
    if (typeof data.noindex !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid "noindex": expected a boolean.' });
    }

    result.noindex = data.noindex;
  }

  for (const key of ['background', 'description', 'title'] as const) {
    const value = data[key];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `Invalid "${key}": expected a string.` });
    }

    if (key === 'title' && value.length > MAINTENANCE_TITLE_MAX_LENGTH) {
      throw createError({ statusCode: 400, statusMessage: `Invalid "title": expected at most ${MAINTENANCE_TITLE_MAX_LENGTH} characters.` });
    }

    if (key === 'description' && value.length > MAINTENANCE_DESCRIPTION_MAX_LENGTH) {
      throw createError({ statusCode: 400, statusMessage: `Invalid "description": expected at most ${MAINTENANCE_DESCRIPTION_MAX_LENGTH} characters.` });
    }

    if (key === 'background' && !MAINTENANCE_BACKGROUND_PATTERN.test(value)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid "background": expected a hexadecimal color such as #101014.' });
    }

    result[key] = value;
  }

  if (Object.keys(result).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Empty body: expected at least one of "status", "noindex", "background", "description", "title".',
    });
  }

  return result;
}

export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  const body = await readBody(event);
  const input = readMaintenanceBody(body);

  try {
    const { maintenance } = await updateSiteMaintenance(event, id, input);
    return { maintenance };
  } catch (e) {
    throw toH3Error(e);
  }
});
