import { NOTE_MAX_LENGTH, noteLength } from '#shared/constants/notes';

/** `null` clears the note. @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site-note */
function readNote(body: unknown): string | null {
  const data = (body ?? {}) as Record<string, unknown>;

  if (data.note === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "note": expected a string or null.' });
  }

  if (data.note === null) {
    return null;
  }

  if (typeof data.note !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid "note": expected a string or null.' });
  }

  const length = noteLength(data.note);

  if (length > NOTE_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid "note": expected at most ${NOTE_MAX_LENGTH} characters of text, got ${length}.`,
    });
  }

  return data.note;
}

export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  const body = await readBody(event);
  const note = readNote(body);

  try {
    const { site } = await updateSiteNote(event, id, note);
    return { site };
  } catch (e) {
    throw toH3Error(e);
  }
});
