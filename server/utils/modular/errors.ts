import type { H3Error } from 'h3';
import { createError, isError } from 'h3';
import type { JsonApiErrorObject } from '#shared/types/jsonapi';

interface RawJsonApiError {
  status?: unknown;
  title?: unknown;
  detail?: unknown;
  code?: unknown;
  source?: unknown;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function projectJsonApiErrors(document: unknown): JsonApiErrorObject[] {
  const candidates = (document as { errors?: unknown } | null)?.errors;

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.flatMap((candidate) => {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      return [];
    }

    const raw = candidate as RawJsonApiError;
    const rawSource = typeof raw.source === 'object' && raw.source !== null && !Array.isArray(raw.source)
      ? raw.source as { parameter?: unknown; pointer?: unknown }
      : undefined;
    const source = rawSource
      ? {
          parameter: optionalString(rawSource.parameter),
          pointer: optionalString(rawSource.pointer),
        }
      : undefined;

    return [{
      status: optionalString(raw.status),
      title: optionalString(raw.title),
      detail: optionalString(raw.detail),
      code: optionalString(raw.code),
      ...(source?.parameter || source?.pointer ? { source } : {}),
    }];
  });
}

export class ModularApiError extends Error {
  readonly errors: JsonApiErrorObject[];

  constructor(readonly status: number, document: unknown) {
    const errors = projectJsonApiErrors(document);
    super(`Modular API answered ${status}: ${errors.map((error) => error.title).filter(Boolean).join('; ') || '(no detail)'}`);
    this.name = 'ModularApiError';
    this.errors = errors;
  }
}

/** Network failure, timeout, a blocked redirect or a non-JSON body. */
export class ModularTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModularTransportError';
  }
}

export class ModularNoApiKeyError extends Error {
  constructor() {
    super('No Modular API key available for this request.');
    this.name = 'ModularNoApiKeyError';
  }
}

export function toH3Error(e: unknown): H3Error {
  // A misconfigured base URL is already an H3 error; relabeling it would blame the API.
  if (isError(e)) {
    return e;
  }

  if (e instanceof ModularNoApiKeyError) {
    return createError({
      statusCode: 401,
      statusMessage: 'Add your API key in Settings to start using the app.',
      data: { code: 'no_api_key' },
    });
  }

  if (e instanceof ModularApiError) {
    if (e.status === 401) {
      return createError({
        statusCode: 401,
        statusMessage: 'The API rejected this key.',
        data: { code: 'invalid_api_key', errors: e.errors },
      });
    }

    if (e.status === 403) {
      return createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to perform this action.',
        data: { code: 'forbidden', errors: e.errors },
      });
    }

    if (e.status === 404) {
      return createError({ statusCode: 404, statusMessage: 'Not found', data: { code: 'not_found', errors: e.errors } });
    }

    if (e.status >= 500) {
      return createError({
        statusCode: 502,
        statusMessage: 'Modular upstream error',
        data: { code: 'modular_upstream', errors: e.errors },
      });
    }

    return createError({
      statusCode: e.status,
      statusMessage: 'Modular API error',
      data: { code: 'modular_api', errors: e.errors },
    });
  }

  if (e instanceof ModularTransportError) {
    return createError({ statusCode: 502, statusMessage: 'Could not reach the Modular API', data: { code: 'transport' } });
  }

  // Anything else is a bug in this app, so Nitro answers its plain 500.
  throw e;
}
