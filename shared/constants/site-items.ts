export const SITE_ITEM_TYPES = ['core', 'plugin', 'theme'] as const;
export type SiteItemType = typeof SITE_ITEM_TYPES[number];

export const SITE_ITEM_STATUSES = ['active', 'inactive', 'uninstalled'] as const;
export type SiteItemStatus = typeof SITE_ITEM_STATUSES[number];
