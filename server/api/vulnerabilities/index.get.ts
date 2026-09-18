import { VULNERABILITY_COMPONENT_TYPES, VULNERABILITY_SEVERITIES } from '#shared/constants/vulnerabilities';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const input: VulnerabilitiesListInput = {
    severity: readEnumList(query.severity, VULNERABILITY_SEVERITIES),
    componentType: readEnumList(query.componentType, VULNERABILITY_COMPONENT_TYPES),
    page: readIntParam(query.page, { min: 1, fallback: 1 }),
  };

  try {
    const page = await fetchVulnerabilities(event, input);
    return { items: page.items, meta: page.meta };
  } catch (e) {
    throw toH3Error(e);
  }
});
