function readTeamNameBody(body: unknown): string {
  const data = (body ?? {}) as Record<string, unknown>;

  if (typeof data.name !== 'string' || data.name.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid "name": expected a non-empty string.' });
  }

  if (data.name.trim().length > 60) {
    throw createError({ statusCode: 400, statusMessage: 'The team name cannot be longer than 60 characters.' });
  }

  return data.name.trim();
}

export default defineEventHandler(async (event): Promise<{ team: Team }> => {
  const name = readTeamNameBody(await readBody(event));

  try {
    const { team } = await createTeam(event, { name });
    setResponseStatus(event, 201);
    return { team };
  } catch (e) {
    throw toH3Error(e);
  }
});
