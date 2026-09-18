export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const input: TeamsListInput = {
    q: readOptionalString(query.q),
    ids: readIdList(query.ids),
    page: readIntParam(query.page, { min: 1, fallback: 1 }),
  };

  try {
    const { page } = await fetchTeams(event, input);
    return { items: page.items, meta: page.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
