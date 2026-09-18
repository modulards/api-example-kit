<script setup lang="ts">
import type { NuxtError } from '#app';

interface SiteHealthResponse {
  items: SiteHealthCheck[];
  meta: Page<SiteHealthCheck>['meta'];
}

const props = defineProps<{
  site: Site;
}>();

const { data, error, status, refresh } = useFetch<SiteHealthResponse, NuxtError>(
  () => `/api/sites/${props.site.id}/health`,
  { retry: 0 },
);

const checks = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const pending = computed(() => status.value === 'pending');
const notFound = computed(() => error.value?.statusCode === 404);

function healthStatusTone(healthStatus: SiteHealthStatus): 'success' | 'warning' | 'error' {
  if (healthStatus === 'good') {
    return 'success';
  }

  if (healthStatus === 'recommended') {
    return 'warning';
  }

  return 'error';
}

function healthStatusLabel(healthStatus: SiteHealthStatus): string {
  if (healthStatus === 'good') {
    return 'Good';
  }

  if (healthStatus === 'recommended') {
    return 'Recommended';
  }

  return 'Critical';
}

function effectiveHealthStatus(check: SiteHealthCheck): SiteHealthStatus {
  return check.effective_status ?? check.status;
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Health checks</h2>
      <div class="grow" />
      <span v-if="data" class="text-meta text-muted">{{ total }} total</span>
    </template>

    <div v-if="pending" class="flex flex-col gap-2">
      <USkeleton v-for="n in 3" :key="n" class="h-5 w-full" />
    </div>

    <p v-else-if="notFound" class="text-meta text-dimmed">
      Not available for this site
    </p>

    <AppErrorState v-else-if="error" :error="error" :retry="refresh" />

    <p v-else-if="checks.length === 0" class="text-meta text-dimmed">
      No checks yet
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li v-for="check in checks" :key="check.id" class="flex items-center justify-between gap-3">
        <span class="min-w-0 truncate text-meta text-toned">{{ check.label }}</span>
        <UBadge :color="healthStatusTone(effectiveHealthStatus(check))" variant="soft" size="sm" :label="healthStatusLabel(effectiveHealthStatus(check))" />
      </li>
    </ul>
  </UCard>
</template>
