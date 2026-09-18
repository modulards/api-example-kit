export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = readOptionalString(query.q);
  const page = readIntParam(query.page, { min: 1, fallback: 1 });

  try {
    const { page: result } = await fetchTags(event, { q, page });
    return { items: result.items, meta: result.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
