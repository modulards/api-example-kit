import type { H3Event } from 'h3';
import type { SingleDocument } from '#shared/types/jsonapi';
import type { SiteCertificate, SiteCertificateAttributes } from '#shared/types/modular';

export const SITE_CERTIFICATE_FIELDS = [
  'configured',
  'enabled',
  'ssl_status',
  'issuer',
  'subject',
  'valid_from',
  'valid_to',
  'days_until_expiry',
  'protocol',
  'sans',
] as const satisfies readonly (keyof SiteCertificateAttributes)[];

function projectCertificateParty(
  party: SiteCertificateAttributes['issuer'],
): SiteCertificateAttributes['issuer'] {
  return party
    ? {
        cn: party.cn,
        o: party.o,
        c: party.c,
        ou: party.ou,
      }
    : party;
}

export function projectSiteCertificate(
  certificate: SiteCertificateAttributes,
): SiteCertificate {
  return {
    configured: certificate.configured,
    enabled: certificate.enabled,
    ssl_status: certificate.ssl_status,
    issuer: projectCertificateParty(certificate.issuer),
    subject: projectCertificateParty(certificate.subject),
    valid_from: certificate.valid_from,
    valid_to: certificate.valid_to,
    days_until_expiry: certificate.days_until_expiry,
    protocol: certificate.protocol,
    sans: certificate.sans ? [...certificate.sans] : certificate.sans,
  };
}

/** @see https://api.docs.modulards.com/modular-ds-public-api/sites/show-site-certificate */
export async function fetchSiteCertificate(event: H3Event, siteId: string): Promise<{ certificate: SiteCertificate }> {
  const { data } = await modularFetch<SingleDocument<SiteCertificateAttributes>>(event, {
    path: `/sites/${siteId}/certificate`,
  });
  return { certificate: projectSiteCertificate(data.data.attributes!) };
}
