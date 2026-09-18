<script setup lang="ts">
import type { UptimeAvailabilityWindowKey } from '#shared/constants/uptime';
import { UPTIME_AVAILABILITY_WINDOWS, uptimeStatusLabel, uptimeStatusTone } from '#shared/constants/uptime';

const WINDOW_LABEL: Record<UptimeAvailabilityWindowKey, string> = {
  day: 'Last 24 hours',
  week: 'Last 7 days',
  month: 'Last 30 days',
};

function uptimeWindowLabel(window: UptimeAvailabilityWindowKey): string {
  return WINDOW_LABEL[window];
}

interface SiteUptimeResponse {
  uptime: SiteUptime;
}

interface PingRow {
  label: string;
  value: string;
  mono?: boolean;
}

const props = defineProps<{
  site: Site;
}>();

// Not awaited: the tab draws its own skeleton instead of blocking the page's Suspense.
const { data, error, status, refresh } = useFetch<SiteUptimeResponse>(
  () => `/api/sites/${props.site.id}/uptime`,
  { retry: 0 },
);

const uptime = computed(() => data.value?.uptime);
const pending = computed(() => status.value === 'pending');

// An unmonitored site answers only `configured: false`: https://api.docs.modulards.com/modular-ds-public-api/sites/show-site-uptime
const isConfigured = computed(() => uptime.value?.configured === true);

// Paused monitoring keeps stale figures.
const isPaused = computed(() => isConfigured.value && uptime.value?.enabled === false);

const statusLabel = computed(() => uptimeStatusLabel(uptime.value?.status ?? null));
const statusTone = computed(() => uptimeStatusTone(uptime.value?.status ?? null));

const PERCENTAGE_FORMATTER = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

function pingsLabel(total: number): string {
  if (total === 0) {
    return 'No checks';
  }

  return total === 1 ? '1 check' : `${NUMBER_FORMATTER.format(total)} checks`;
}

// No pings yet (`percentage: null`) is not 0% availability.
const availabilityCards = computed(() => UPTIME_AVAILABILITY_WINDOWS.map((window) => {
  const measure = uptime.value?.availability?.[window];
  const percentage = measure?.percentage ?? null;
  const totalPings = measure?.total_pings ?? 0;

  return {
    key: window,
    label: uptimeWindowLabel(window),
    value: percentage === null ? '—' : PERCENTAGE_FORMATTER.format(percentage),
    unit: percentage === null ? 'no data' : '%',
    ratio: percentage === null ? undefined : Math.min(Math.max(percentage / 100, 0), 1),
    hint: pingsLabel(totalPings),
  };
}));

const lastPingRows = computed<PingRow[]>(() => {
  const ping = uptime.value?.last_ping;

  if (!ping) {
    return [];
  }

  const rows: PingRow[] = [
    { label: 'Time', value: formatDateTime(ping.at) },
    { label: 'Result', value: uptimeStatusLabel(ping.status) },
    { label: 'Response code', value: ping.status_code === null ? '—' : String(ping.status_code), mono: true },
    {
      label: 'Response time',
      value: ping.response_time_ms === null ? '—' : `${NUMBER_FORMATTER.format(ping.response_time_ms)} ms`,
      mono: true,
    },
  ];

  return rows;
});

const lastPingError = computed(() => uptime.value?.last_ping?.error ?? null);
</script>

<template>
  <div class="flex flex-col gap-5">
    <div v-if="pending && !uptime" class="flex flex-col gap-5">
      <USkeleton class="h-24 rounded-panel" />
      <div class="grid gap-4 sm:grid-cols-3">
        <USkeleton class="h-28 rounded-panel" />
        <USkeleton class="h-28 rounded-panel" />
        <USkeleton class="h-28 rounded-panel" />
      </div>
      <USkeleton class="h-44 rounded-panel" />
    </div>

    <UCard v-else-if="error" :ui="{ body: 'p-0 sm:p-0' }">
      <AppErrorState :error="error" :retry="refresh" />
    </UCard>

    <UCard v-else-if="!isConfigured" :ui="{ body: 'p-0 sm:p-0' }">
      <UEmpty
        icon="i-lucide-radio-tower"
        title="Uptime monitoring is not configured for this site"
        description="Once monitoring is configured, this tab will show status, the latest check, and uptime percentage."
      />
    </UCard>

    <template v-else-if="uptime">
      <UCard>
        <template #header>
          <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Current status</h2>
        </template>

        <div class="flex flex-col items-start gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          <UBadge :color="statusTone" variant="soft" :label="statusLabel" :title="statusLabel" />

          <span class="text-meta text-muted">
            {{ uptime.status_since ? `Since ${formatDateTime(uptime.status_since)}` : 'No status changes recorded' }}
          </span>

          <div class="hidden grow sm:block" />

          <span class="w-full break-all font-mono text-mono-sm text-muted sm:w-auto sm:truncate">{{ site.display_host }}</span>
        </div>

        <p v-if="isPaused" class="mt-3 text-meta text-warning">
          Monitoring is paused, so the data below may be out of date.
        </p>
      </UCard>

      <div class="grid gap-4 sm:grid-cols-3">
        <StatCard
          v-for="card in availabilityCards"
          :key="card.key"
          :label="card.label"
          :value="card.value"
          :unit="card.unit"
          :ratio="card.ratio"
          :hint="card.hint"
          :status="status"
        />
      </div>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Latest check</h2>
        </template>

        <div v-if="lastPingRows.length === 0" class="px-5">
          <UEmpty
            icon="i-lucide-activity"
            title="No checks have run yet"
            description="Once the first one runs, you'll see when it happened and how the site responded."
          />
        </div>

        <template v-else>
          <dl class="px-5">
            <div
              v-for="row in lastPingRows"
              :key="row.label"
              class="flex flex-col items-start gap-1 border-b border-muted py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <dt class="text-meta text-muted sm:shrink-0">
                {{ row.label }}
              </dt>
              <dd class="w-full min-w-0 break-all text-toned sm:w-auto sm:truncate sm:text-right" :class="row.mono ? 'font-mono text-mono' : 'text-meta'">
                {{ row.value }}
              </dd>
            </div>
          </dl>

          <div v-if="lastPingError" class="border-t border-default px-5 py-3">
            <p class="text-eyebrow font-medium uppercase text-muted">
              Error returned
            </p>
            <p class="mt-1.5 break-words font-mono text-mono-sm text-error">
              {{ lastPingError }}
            </p>
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
