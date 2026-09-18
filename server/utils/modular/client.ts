import type { H3Event } from 'h3';

export interface ModularRequest {
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, unknown>;
  body?: unknown;
  /** Lets `PUT /api/key` test a candidate key before saving it. */
  token?: string;
}

const TIMEOUT_MS = 15_000;

const BASE_URL = 'https://api.modulards.com/api/public/v1';

async function resolveToken(event: H3Event, candidate: string | undefined): Promise<string> {
  const token = candidate ?? await readApiKeyToken(event);

  if (!token) {
    throw new ModularNoApiKeyError();
  }

  return token;
}

/** Arrays become repeated keys, never comma-joined. @see https://api.docs.modulards.com/modular-ds-public-api */
function buildQueryString(query: Record<string, unknown> | undefined): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) {
          continue;
        }

        params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function modularFetch<T>(event: H3Event, req: ModularRequest): Promise<{ data: T }> {
  const token = await resolveToken(event, req.token);
  const method = req.method ?? 'GET';
  const url = `${BASE_URL}${req.path}${buildQueryString(req.query)}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.api+json',
    Authorization: `Bearer ${token}`,
  };

  if (req.body !== undefined) {
    headers['Content-Type'] = 'application/vnd.api+json';
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
      // Following a redirect would forward the bearer token to another host.
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    const errorName = cause instanceof Error && cause.name === 'TimeoutError' ? 'TimeoutError' : 'NetworkError';
    console.error(`[modular] ${method} ${req.path} failed (${errorName})`);
    throw new ModularTransportError(`Modular API: no response on ${method} ${req.path}`);
  }

  if (response.status >= 300 && response.status < 400) {
    console.error(`[modular] ${method} ${req.path} blocked redirect (${response.status})`);
    throw new ModularTransportError(`Modular API: redirect blocked on ${method} ${req.path}`);
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch {
    console.error(`[modular] ${method} ${req.path} failed (NonJsonResponse), status ${response.status}`);
    throw new ModularTransportError(`Modular API: non-JSON body (${response.status}) on ${method} ${req.path}`);
  }

  if (response.status >= 400) {
    throw new ModularApiError(response.status, parsed);
  }

  return { data: parsed as T };
}
