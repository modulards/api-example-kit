export const MAINTENANCE_STATUSES = ['enabled', 'disabled'] as const;
export type MaintenanceStatus = typeof MAINTENANCE_STATUSES[number];

export const MAINTENANCE_TITLE_MAX_LENGTH = 70;
export const MAINTENANCE_DESCRIPTION_MAX_LENGTH = 250;

export const MAINTENANCE_BACKGROUND_PATTERN = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
