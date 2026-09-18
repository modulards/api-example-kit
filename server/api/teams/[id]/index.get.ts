export default defineEventHandler(async (event): Promise<{ team: Team }> => {
  const id = readNumericRouteId(event, 'team');

  try {
    const { team } = await fetchTeam(event, id);
    return { team };
  } catch (e) {
    throw toH3Error(e);
  }
});
