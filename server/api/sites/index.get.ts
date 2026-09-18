export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const q = readOptionalString(query.q);
  const tags = readIdList(query.tags);
  const team = readIdList(query.team);
  const connected = readBooleanParam(query.connected);
  const page = readIntParam(query.page, { min: 1, fallback: 1 });

  try {
    const { page: result } = await fetchSites(event, { q, tags, team, connected, page });
    return { items: result.items, meta: result.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
