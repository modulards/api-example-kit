import { afterEach, describe, expect, it, vi } from 'vitest';
import type { H3Event } from 'h3';
import type { ResourceObject } from '#shared/types/jsonapi';
import type { SiteCertificateAttributes } from '#shared/types/modular';
import { ModularApiError, toH3Error } from '../../server/utils/modular/errors';
import { toDto } from '../../server/utils/modular/jsonapi';
import { modularFetch } from '../../server/utils/modular/client';
import { fetchSiteCertificate } from '../../server/utils/modular/site-certificate';

describe('JSON:API response projection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('omits upstream attributes outside the resource allowlist', () => {
    interface ExampleAttributes {
      name: string;
      status: string;
    }

    const resource = {
      id: '12',
      type: 'examples',
      attributes: {
        name: 'Visible',
        status: 'active',
        secret: 'must-not-cross-the-proxy',
      },
    } as ResourceObject<ExampleAttributes>;
    const fields = ['name'] as const satisfies readonly (keyof ExampleAttributes)[];

    expect(toDto(resource, fields)).toEqual({ id: '12', name: 'Visible' });
  });

  it('omits private members from an upstream JSON:API error', () => {
    const error = toH3Error(new ModularApiError(422, {
      errors: [{
        status: '422',
        title: 'Invalid field',
        detail: 'Name is required.',
        code: 'validation_error',
        source: { pointer: '/data/attributes/name', internal: 'private' },
        meta: { trace: 'secret' },
        exception: 'SensitiveException',
      }],
    }));

    expect(error.data).toEqual({
      code: 'modular_api',
      errors: [{
        status: '422',
        title: 'Invalid field',
        detail: 'Name is required.',
        code: 'validation_error',
        source: { pointer: '/data/attributes/name' },
      }],
    });
  });

  it('reads certificate resource attributes and omits unapproved nested members', async () => {
    const certificate = {
      configured: true,
      enabled: true,
      ssl_status: 'up',
      issuer: { cn: 'Example CA', o: null, c: 'US', ou: null, private_key: 'secret' },
      subject: { cn: 'example.test', o: null, c: null, ou: null, account: 'secret' },
      valid_from: '2026-01-01T00:00:00Z',
      valid_to: '2027-01-01T00:00:00Z',
      days_until_expiry: 109,
      protocol: 'TLSv1.3',
      sans: ['example.test'],
      internal: 'secret',
    } as SiteCertificateAttributes;

    vi.stubGlobal('readApiKeyToken', async () => 'test-token');
    vi.stubGlobal('modularFetch', modularFetch);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      data: { type: 'site-certificates', id: '12', attributes: certificate },
      jsonapi: { version: '1.1' },
    })));

    const result = await fetchSiteCertificate({} as H3Event, '12');

    expect(result.certificate).toEqual({
      configured: true,
      enabled: true,
      ssl_status: 'up',
      issuer: { cn: 'Example CA', o: null, c: 'US', ou: null },
      subject: { cn: 'example.test', o: null, c: null, ou: null },
      valid_from: '2026-01-01T00:00:00Z',
      valid_to: '2027-01-01T00:00:00Z',
      days_until_expiry: 109,
      protocol: 'TLSv1.3',
      sans: ['example.test'],
    });
  });
});
