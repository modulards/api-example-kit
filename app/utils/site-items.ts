import type { SiteItemStatus, SiteItemType } from '#shared/constants/site-items';

const TYPE_LABEL: Record<SiteItemType, string> = {
  core: 'Core',
  plugin: 'Plugin',
  theme: 'Theme',
};

export function siteItemTypeLabel(type: string | null | undefined): string {
  if (type == null) {
    return 'No type';
  }

  return TYPE_LABEL[type as SiteItemType] ?? type;
}

const STATUS_LABEL: Record<SiteItemStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  uninstalled: 'Uninstalled',
};

export function siteItemStatusLabel(status: string | null | undefined): string {
  if (status == null) {
    return 'No status';
  }

  return STATUS_LABEL[status as SiteItemStatus] ?? status;
}

type SiteItemStatusTone = 'success' | 'neutral' | 'error';

const STATUS_TONE: Record<SiteItemStatus, SiteItemStatusTone> = {
  active: 'success',
  inactive: 'neutral',
  uninstalled: 'error',
};

export function siteItemStatusTone(status: string | null | undefined): SiteItemStatusTone {
  return STATUS_TONE[status as SiteItemStatus] ?? 'neutral';
}
