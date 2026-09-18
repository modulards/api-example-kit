import type { H3Event } from 'h3';
import { createError, getRouterParam } from 'h3';

/** `getQuery` returns an array when a key repeats. */
function firstOf(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

export type NumericRouteIdLabel = 'site' | 'tag' | 'team' | 'component' | 'site item' | 'site action';

export function readNumericRouteId(event: H3Event, label: NumericRouteIdLabel = 'site'): string {
  const id = getRouterParam(event, 'id');

  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${label} id "${id ?? ''}". Expected a numeric id.` });
  }

  return id;
}

function toStringList(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }

  const items = Array.isArray(value) ? value : [value];
  return items.map((item) => String(item));
}

export function readOptionalString(value: unknown): string | undefined {
  const raw = firstOf(value);
  return raw === undefined ? undefined : String(raw);
}

export function readIntParam(
  value: unknown,
  opts: { min?: number; max?: number; fallback?: number } = {},
): number {
  const raw = firstOf(value);

  if (raw === undefined) {
    if (opts.fallback !== undefined) {
      return opts.fallback;
    }

    throw createError({ statusCode: 400, statusMessage: 'Missing required integer parameter.' });
  }

  const text = String(raw).trim();

  if (!/^-?\d+$/.test(text)) {
    throw createError({ statusCode: 400, statusMessage: `Expected an integer, got "${text}".` });
  }

  const parsed = Number(text);

  if (!Number.isSafeInteger(parsed)) {
    throw createError({ statusCode: 400, statusMessage: `Expected a safe integer, got "${text}".` });
  }

  if (opts.min !== undefined && parsed < opts.min) {
    throw createError({ statusCode: 400, statusMessage: `Expected a value >= ${opts.min}, got ${parsed}.` });
  }

  if (opts.max !== undefined && parsed > opts.max) {
    throw createError({ statusCode: 400, statusMessage: `Expected a value <= ${opts.max}, got ${parsed}.` });
  }

  return parsed;
}

export function readEnumList<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  const items = toStringList(value);
  const invalid = items.filter((item) => !allowed.includes(item as T));

  if (invalid.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid value(s): ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}.`,
    });
  }

  return items as T[];
}

export function readIdList(value: unknown): string[] {
  const items = toStringList(value);
  const invalid = items.filter((item) => !/^\d+$/.test(item));

  if (invalid.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid id(s): ${invalid.join(', ')}. Expected numeric ids.`,
    });
  }

  return items;
}

export function readBooleanParam(value: unknown): boolean | undefined {
  const raw = firstOf(value);

  if (raw === undefined) {
    return undefined;
  }

  const text = String(raw);

  if (text === '1') {
    return true;
  }

  if (text === '0') {
    return false;
  }

  throw createError({ statusCode: 400, statusMessage: `Expected "1", "0" or omitted, got "${text}".` });
}

export function readSiteSelection(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected "sites" to be an array of site IDs.' });
  }

  if (value.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one site must be selected.' });
  }

  if (value.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot select more than 200 sites.' });
  }

  const seen = new Set<number>();
  const ids: number[] = [];

  for (const item of value) {
    if (typeof item !== 'number' || !Number.isSafeInteger(item) || item <= 0) {
      throw createError({ statusCode: 400, statusMessage: `Invalid site id "${String(item)}". Expected a positive integer.` });
    }

    if (seen.has(item)) {
      throw createError({ statusCode: 400, statusMessage: `Duplicate site id "${item}" in selection.` });
    }

    seen.add(item);
    ids.push(item);
  }

  return ids;
}
