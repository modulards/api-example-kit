<script setup lang="ts">
import type { NuxtError } from '#app';

interface SiteCertificateResponse {
  certificate: SiteCertificate;
}

const props = defineProps<{
  site: Site;
}>();

const { data, error, status, refresh } = useFetch<SiteCertificateResponse, NuxtError>(
  () => `/api/sites/${props.site.id}/certificate`,
  { retry: 0 },
);

const certificate = computed(() => data.value?.certificate);
const pending = computed(() => status.value === 'pending');
const notFound = computed(() => error.value?.statusCode === 404);
const isPaused = computed(() => certificate.value?.configured === true && certificate.value.enabled === false);

function monitoringLabel(enabled: boolean | null | undefined): string {
  if (enabled === true) {
    return 'Active';
  }

  if (enabled === false) {
    return 'Paused';
  }

  return 'Unknown';
}

function monitoringTone(enabled: boolean | null | undefined): 'success' | 'warning' | 'neutral' {
  if (enabled === true) {
    return 'success';
  }

  if (enabled === false) {
    return 'warning';
  }

  return 'neutral';
}

const reportedSslStatusLabel = computed(() => {
  const label = sslStatusLabel(certificate.value?.ssl_status);
  return isPaused.value ? `Last reported: ${label}` : label;
});

const reportedSslStatusTone = computed(() =>
  isPaused.value ? 'neutral' : sslStatusTone(certificate.value?.ssl_status),
);

const reportedExpiryLabel = computed(() => {
  const label = expiryLabel(certificate.value?.days_until_expiry);
  return isPaused.value ? `Last reported: ${label}` : label;
});

function sslStatusLabel(sslStatus: string | null | undefined): string {
  if (sslStatus === 'up') {
    return 'Valid';
  }

  if (sslStatus === 'down') {
    return 'Has issues';
  }

  return 'Unknown';
}

function sslStatusTone(sslStatus: string | null | undefined): 'success' | 'error' | 'neutral' {
  if (sslStatus === 'up') {
    return 'success';
  }

  if (sslStatus === 'down') {
    return 'error';
  }

  return 'neutral';
}

function expiryLabel(days: number | null | undefined): string {
  if (days == null) {
    return 'No expiry date';
  }

  if (days < 0) {
    return `Expired ${Math.abs(days)} days ago`;
  }

  return `Expires in ${days} days`;
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Certificate</h2>
      <div class="grow" />
      <UBadge
        v-if="certificate?.configured"
        :color="monitoringTone(certificate.enabled)"
        variant="subtle"
        :label="monitoringLabel(certificate.enabled)"
      />
    </template>

    <div v-if="pending" class="flex flex-col gap-2">
      <USkeleton class="h-5 w-20" />
      <USkeleton class="h-4 w-40" />
    </div>

    <p v-else-if="notFound" class="text-meta text-dimmed">
      Not available for this site
    </p>

    <AppErrorState v-else-if="error" :error="error" :retry="refresh" />

    <p v-else-if="!certificate?.configured" class="text-meta text-dimmed">
      Not monitored
    </p>

    <div v-else class="flex flex-col gap-2">
      <div>
        <UBadge :color="reportedSslStatusTone" variant="soft" :label="reportedSslStatusLabel" />
      </div>
      <p v-if="isPaused" class="text-meta text-warning">
        Certificate monitoring is paused, so the data below may be out of date.
      </p>
      <p class="text-meta text-toned">
        {{ reportedExpiryLabel }}
      </p>
      <p class="truncate text-meta text-muted">
        {{ isPaused ? 'Last reported issuer' : 'Issued by' }} {{ certificate.issuer?.cn ?? 'unknown' }}
      </p>
    </div>
  </UCard>
</template>
