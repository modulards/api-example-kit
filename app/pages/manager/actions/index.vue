<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { SiteAction, SiteActionStatus } from '#shared/types/modular';
import { sentenceCase } from '#shared/utils/text';
import { SITE_ACTION_STATUSES } from '#shared/constants/site-actions';

useHead({ title: 'Activity' });
const route = useRoute();

const { filter, page, query, reset, activeCount } = useListFilters(['status', 'q', 'site', 'component']);
const statusFilter = filter('status');
const searchFilter = filter('q');
const siteFilter = filter('site');
const componentFilter = filter('component');
const searchInput = shallowRef(searchFilter.value[0] ?? '');

function applySearch(): void {
  const value = searchInput.value.trim();
  searchFilter.value = value ? [value] : [];
}

watch(searchFilter, (value) => {
  searchInput.value = value[0] ?? '';
});

const statusOptions: { label: string; value: string }[] = SITE_ACTION_STATUSES.map((status) => ({
  label: sentenceCase(status.replaceAll('_', ' ')),
  value: status,
}));

const { actions: pendingActions, remember } = usePendingActions();
const { data, status, error, refresh } = useFetch('/api/site-actions', {
  query,
  retry: 0,
});

const fetchedActions = computed(() => data.value?.items ?? []);
const actions = computed(() => fetchedActions.value.map(
  (action) => pendingActions.value.find((candidate) => candidate.id === action.id) ?? action,
));
const isLoading = computed(() => status.value === 'pending');
const total = computed(() => data.value?.meta.total ?? actions.value.length);

watch(fetchedActions, (value) => {
  remember(value);
}, { immediate: true });

const siteContextNames = computed(() => [...new Set(
  actions.value.flatMap((action) => action.site?.name ? [action.site.name] : []),
)]);
const componentContextNames = computed(() => [...new Set(
  actions.value.flatMap((action) =>
    (action.managed_items ?? []).flatMap((item) => item.name ? [item.name] : [])),
)]);
const contextVisible = computed(() => siteFilter.value.length > 0 || componentFilter.value.length > 0);

watch(error, (value) => {
  if (value) {
    notifyApiError(value);
  }
});

type StatusTone = 'neutral' | 'info' | 'error' | 'success' | 'warning';

const STATUS_TONE: Record<SiteActionStatus, StatusTone> = {
  pending: 'neutral',
  in_progress: 'info',
  failed: 'error',
  done: 'success',
  requires_action: 'warning',
};

function statusTone(actionStatus: SiteActionStatus): StatusTone {
  return STATUS_TONE[actionStatus];
}

function statusLabel(status: SiteActionStatus): string {
  return sentenceCase(status.replaceAll('_', ' '));
}

function siteContextLabel(): string {
  if (siteContextNames.value.length > 0) {
    return siteContextNames.value.join(', ');
  }

  return `${siteFilter.value.length} selected ${siteFilter.value.length === 1 ? 'site' : 'sites'}`;
}

function componentContextLabel(): string {
  return componentContextNames.value.join(', ') || 'Selected component';
}

const columns: TableColumn<SiteAction>[] = [
  { id: 'site', header: 'Site' },
  { id: 'type', header: 'Request' },
  { id: 'status', header: 'Status' },
  { id: 'created_at', header: 'Requested' },
];
</script>

<template>
  <AppNavbar title="Activity">
    <template #trailing>
      <USeparator orientation="vertical" class="hidden h-3.5 sm:block" />
      <span class="hidden min-w-0 truncate text-meta text-muted sm:block">Action requests across every site</span>
      <span v-if="data" class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ total }}</span>
    </template>
  </AppNavbar>

  <ManagerNavigation />

  <UDashboardToolbar>
    <template #left>
      <UInput
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="Search activity, then press Enter"
        aria-label="Search activity"
        class="w-full sm:w-64"
        @keydown.enter="applySearch"
      />
      <USelectMenu
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        :multiple="true"
        icon="i-lucide-flag"
        placeholder="Status"
        aria-label="Filter by status"
        class="w-full sm:w-44"
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

  <div class="flex flex-col gap-5 px-4 py-6 sm:px-6">
    <p v-if="contextVisible" class="text-meta text-dimmed">
      Context:
      <template v-if="siteFilter.length > 0">
        {{ siteContextLabel() }}
      </template>
      <template v-if="siteFilter.length > 0 && componentFilter.length > 0"> · </template>
      <template v-if="componentFilter.length > 0">
        {{ componentContextLabel() }}
      </template>
    </p>

    <UCard v-if="error" :ui="{ body: 'p-0 sm:p-0' }">
      <AppErrorState :error="error" size="lg" :retry="refresh" />
    </UCard>

    <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="actions"
        :columns="columns"
        :loading="isLoading"
        loading-color="primary"
        loading-animation="carousel"
      >
        <template #empty>
          <UEmpty
            icon="i-lucide-list-checks"
            :title="activeCount > 0 ? 'No activity matches these filters' : 'No action requests yet'"
            :description="activeCount > 0 ? 'Try another search or clear the filters.' : 'Accepted requests appear here.'"
            size="lg"
          />
        </template>

        <template #site-cell="{ row }">
          <NuxtLink
            v-if="row.original.site"
            :to="`/sites/${row.original.site.id}`"
            class="group block min-w-0 truncate text-meta font-medium text-highlighted transition-colors group-hover:text-primary"
          >
            {{ row.original.site.name }}
          </NuxtLink>
          <span v-else class="text-meta text-dimmed">—</span>
        </template>

        <template #type-cell="{ row }">
          <NuxtLink
            :to="{ path: `/manager/actions/${row.original.id}`, query: route.query }"
            class="group flex min-w-0 flex-col leading-tight"
          >
            <span class="truncate text-row font-medium text-highlighted transition-colors group-hover:text-primary">
              {{ actionDisplayName(row.original) }}
            </span>
          </NuxtLink>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusTone(row.original.status)" variant="soft" size="sm" :label="statusLabel(row.original.status)" />
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-meta text-muted">{{ formatDateTime(row.original.created_at) }}</span>
        </template>
      </UTable>
    </UCard>

    <AppPaginationFooter
      v-if="data && total > 0"
      v-model:page="page"
      :total="total"
      :per-page="data.meta.perPage"
    />
  </div>
</template>
