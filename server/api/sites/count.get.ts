export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  try {
    const { count } = await countSites(event, {
      q: readOptionalString(query.q),
      tags: readIdList(query.tags),
      team: readIdList(query.team),
      connected: readBooleanParam(query.connected),
    });
    return { count };
  } catch (e) {
    throw toH3Error(e);
  }
});
