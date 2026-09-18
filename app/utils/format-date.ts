const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

function format(formatter: Intl.DateTimeFormat, value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatter.format(parsed);
}

export function formatDateTime(value: string | null | undefined): string {
  return format(DATE_TIME_FORMATTER, value, '—');
}

export function formatShortDate(value: string | null | undefined): string {
  return format(SHORT_DATE_FORMATTER, value, '—');
}
