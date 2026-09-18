/** @see https://api.docs.modulards.com/modular-ds-public-api/vulnerabilities/list-vulnerabilities */
export const VULNERABILITY_SEVERITIES = ['c', 'h', 'm', 'l', 'n', 'null'] as const;
export type VulnerabilitySeverity = typeof VULNERABILITY_SEVERITIES[number];

export const VULNERABILITY_COMPONENT_TYPES = [
  'core', 'plugin', 'theme', 'php', 'mariadb', 'mysql',
] as const;
export type VulnerabilityComponentType = typeof VULNERABILITY_COMPONENT_TYPES[number];
