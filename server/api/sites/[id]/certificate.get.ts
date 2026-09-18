export default defineEventHandler(async (event) => {
  const id = readNumericRouteId(event);

  try {
    const { certificate } = await fetchSiteCertificate(event, id);
    return { certificate };
  } catch (e) {
    throw toH3Error(e);
  }
});
