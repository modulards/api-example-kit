import type { H3Event } from 'h3';
import { createError } from 'h3';
import type { SiteAttributes, SiteServiceStatus } from '#shared/types/modular';

interface ServiceStatusAttributes {
  service_type: 'woocommerce';
  service_status: 'active' | 'inactive';
  service_is_active: boolean;
  service_is_configured: boolean;
}

interface ServiceStatusDocument {
  data: {
    id: string;
    type: string;
    attributes: SiteAttributes & ServiceStatusAttributes;
  };
}

export const SITE_SERVICE_STATUS_FIELDS = [
  'service_type',
  'service_status',
  'service_is_active',
  'service_is_configured',
] as const satisfies readonly (keyof ServiceStatusAttributes)[];

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site-service-status */
export async function updateSiteServiceStatus(
  event: H3Event,
  id: string,
  status: 'active' | 'inactive',
): Promise<{ service: SiteServiceStatus }> {
  const { data } = await modularFetch<ServiceStatusDocument>(event, {
    path: `/sites/${id}/services/woocommerce/status`,
    method: 'PATCH',
    body: { status },
  });
  const resource = data.data;
  const attrs = resource?.attributes;

  if (
    !resource
    || typeof resource.id !== 'string'
    || !attrs
    || attrs.service_type !== 'woocommerce'
    || (attrs.service_status !== 'active' && attrs.service_status !== 'inactive')
    || typeof attrs.service_is_active !== 'boolean'
    || typeof attrs.service_is_configured !== 'boolean'
  ) {
    throw createError({ statusCode: 502, statusMessage: 'Modular API returned an invalid service status response.' });
  }

  return {
    service: {
      id: resource.id,
      service_type: attrs.service_type,
      service_status: attrs.service_status,
      service_is_active: attrs.service_is_active,
      service_is_configured: attrs.service_is_configured,
    },
  };
}
