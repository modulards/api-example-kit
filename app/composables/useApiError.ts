import type { ApiErrorCode, JsonApiErrorObject } from '#shared/types/jsonapi';

interface ApiErrorData {
  code: ApiErrorCode | undefined;
  errors: JsonApiErrorObject[] | undefined;
}

interface NestedApiErrorBody {
  statusMessage?: string;
  message?: string;
  data?: {
    statusMessage?: string;
    message?: string;
    data?: { code?: ApiErrorCode; errors?: JsonApiErrorObject[] };
  };
}

/** Nitro nests our `createError({ data })` payload under `error.data.data`. */
export function apiErrorData(error: unknown): ApiErrorData {
  const body = (error as NestedApiErrorBody | null | undefined)?.data?.data;
  return { code: body?.code, errors: body?.errors };
}

const TITLE_BY_CODE: Partial<Record<ApiErrorCode, string>> = {
  transport: 'Could not reach the API',
  modular_upstream: 'API server error',
  no_api_key: 'Connect your API key in Settings',
  invalid_api_key: 'API key rejected',
  forbidden: 'Permission denied',
  not_found: 'Not found',
};

export function apiErrorTitle(error: unknown): string {
  const { code, errors } = apiErrorData(error);

  if (code === 'modular_api') {
    return errors?.[0]?.title ?? 'API error';
  }

  return (code ? TITLE_BY_CODE[code] : undefined) ?? 'Something went wrong';
}

/** Errors raised by our own routes carry no JSON:API body, so fall back to their message. */
export function apiErrorDetail(error: unknown): string | undefined {
  const detail = apiErrorData(error).errors?.[0]?.detail;

  if (detail) {
    return detail;
  }

  const body = error as NestedApiErrorBody | null | undefined;
  return body?.data?.statusMessage ?? body?.data?.message ?? body?.statusMessage ?? body?.message ?? undefined;
}

export function notifyApiError(error: unknown): void {
  const toast = useToast();
  toast.add({ title: apiErrorTitle(error), description: apiErrorDetail(error), color: 'error' });
}
