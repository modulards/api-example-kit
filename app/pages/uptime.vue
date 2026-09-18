<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { SiteUptimeStatus } from '#shared/types/modular';
import { UPTIME_STATUSES, uptimeStatusLabel, uptimeStatusTone } from '#shared/constants/uptime';

useHead({ title: 'Uptime' });

function uptimeEnabledLabel(enabled: boolean | null): string {
  if (enabled === null) {
    return 'Unknown';
  }

  return enabled ? 'Active' : 'Paused';
}

// A paused monitor is a deliberate configuration, not an incident: it never warns.
function uptimeEnabledTone(enabled: boolean | null): 'success' | 'neutral' {
  return enabled === true ? 'success' : 'neutral';
}

// Widened to `string`: the filter is URL-derived, not a narrowed enum.
const statusOptions: { label: string; value: string }[] = UPTIME_STATUSES
  .map((value) => ({ label: uptimeStatusLabel(value), value }));

const { filter, page, query, reset, activeCount } = useListFilters(['status']);
const statusFilter = filter('status');

const { data, error, status, refresh } = useFetch('/api/uptime', {
  query,
  retry: 0,
});

const isLoading = computed(() => status.value === 'pending');
const monitors = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const totalLabel = computed(() => (total.value === 1 ? '1 monitor' : `${total.value} monitors`));

const columns: TableColumn<SiteUptimeStatus>[] = [
  { id: 'status', header: 'Status', meta: { class: { th: 'w-[160px]', td: 'w-[160px]' } } },
  { id: 'site', header: 'Site', meta: { class: { th: 'min-w-[260px]', td: 'min-w-[260px] max-w-[360px]' } } },
  { id: 'enabled', header: 'Monitoring', meta: { class: { th: 'w-[160px]', td: 'w-[160px]' } } },
  { id: 'status_since', header: 'Since', meta: { class: { th: 'w-[180px]', td: 'w-[180px]' } } },
  { id: 'last_ping', header: 'Last check', meta: { class: { th: 'w-[190px] text-end', td: 'w-[190px] text-end' } } },
];

// The row id is the monitor's, so links use `site.id`: https://api.docs.modulards.com/modular-ds-public-api/uptime/list-uptime
function openSite(_event: Event, row: { original: SiteUptimeStatus }): void {
  navigateTo(`/sites/${row.original.site.id}`);
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <AppNavbar title="Uptime">
      <template #trailing>
        <span v-if="data" class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ totalLabel }}</span>
      </template>
    </AppNavbar>

    <UDashboardToolbar>
      <template #left>
        <USelectMenu
          v-model="statusFilter"
          :items="statusOptions"
          value-key="value"
          :multiple="true"
          icon="i-lucide-activity"
          placeholder="Status"
          aria-label="Filter by availability status"
          class="w-full sm:w-52"
        />
      </template>

      <template #right>
        <UButton
          v-if="activeCount > 0"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          label="Clear filters"
          @click="reset"
        />
      </template>
    </UDashboardToolbar>

    <AppErrorState v-if="error" :error="error" size="lg" class="grow" :retry="refresh" />

    <template v-else>
      <div class="grow">
        <UTable
          :data="monitors"
          :columns="columns"
          :loading="isLoading"
          loading-color="primary"
          loading-animation="carousel"
          :on-select="openSite"
          :ui="{ th: 'px-4 sm:px-6', td: 'px-4 sm:px-6' }"
        >
          <template #status-cell="{ row }">
            <UBadge
              :color="uptimeStatusTone(row.original.status)"
              variant="soft"
              :label="uptimeStatusLabel(row.original.status)"
            />
          </template>

          <template #site-cell="{ row }">
            <span class="block truncate text-row font-medium text-highlighted" :title="row.original.site.name">
              {{ row.original.site.name }}
            </span>
          </template>

          <template #enabled-cell="{ row }">
            <UBadge
              :color="uptimeEnabledTone(row.original.enabled)"
              variant="subtle"
              :label="uptimeEnabledLabel(row.original.enabled)"
            />
          </template>

          <template #status_since-cell="{ row }">
            <span class="text-meta text-muted">{{ formatDateTime(row.original.status_since) }}</span>
          </template>

          <template #last_ping-cell="{ row }">
            <div class="flex flex-col items-end leading-tight">
              <span class="text-meta text-muted">{{ formatDateTime(row.original.last_ping?.at ?? null) }}</span>
              <span v-if="row.original.last_ping?.response_time_ms != null" class="font-mono text-mono-sm text-dimmed">
                {{ row.original.last_ping?.response_time_ms }} ms
              </span>
            </div>
          </template>

          <template #empty>
            <UEmpty
              v-if="activeCount > 0"
              icon="i-lucide-search-x"
              title="No monitor matches these filters"
              description="Try removing one of the active filters."
              size="md"
            >
              <template #actions>
                <UButton color="neutral" variant="subtle" icon="i-lucide-x" label="Clear filters" @click="reset" />
              </template>
            </UEmpty>
            <UEmpty
              v-else
              icon="i-lucide-radio-tower"
              title="No site has monitoring configured"
              description="The portfolio lists sites with monitoring configured, including paused monitors."
              size="lg"
            />
          </template>
        </UTable>
      </div>

      <AppPaginationFooter
        v-if="data && total > 0"
        v-model:page="page"
        :total="total"
        :per-page="data.meta.perPage"
        variant="page"
      />
    </template>
  </div>
</template>
