export default defineEventHandler(async (event): Promise<{ tag: Tag }> => {
  const id = readNumericRouteId(event, 'tag');

  try {
    const { tag } = await fetchTag(event, id);
    return { tag };
  } catch (e) {
    throw toH3Error(e);
  }
});
