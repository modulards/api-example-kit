export const UPTIME_STATUSES = ['up', 'down', 'unknown'] as const;
export type UptimeStatus = typeof UPTIME_STATUSES[number];

export const UPTIME_AVAILABILITY_WINDOWS = ['day', 'week', 'month'] as const;
export type UptimeAvailabilityWindowKey = typeof UPTIME_AVAILABILITY_WINDOWS[number];

const STATUS_LABEL: Record<UptimeStatus, string> = {
  up: 'Up',
  down: 'Down',
  unknown: 'Unknown',
};

export function uptimeStatusLabel(status: string | null): string {
  if (status === null) {
    return 'Unknown';
  }

  return STATUS_LABEL[status as UptimeStatus] ?? status;
}

type UptimeStatusTone = 'success' | 'error' | 'neutral';

const STATUS_TONE: Record<UptimeStatus, UptimeStatusTone> = {
  up: 'success',
  down: 'error',
  unknown: 'neutral',
};

export function uptimeStatusTone(status: string | null): UptimeStatusTone {
  if (status === null) {
    return 'neutral';
  }

  return STATUS_TONE[status as UptimeStatus] ?? 'neutral';
}
