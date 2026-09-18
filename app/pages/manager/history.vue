<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { SiteItemHistory } from '#shared/types/modular';
import { sentenceCase } from '#shared/utils/text';
import { SITE_ITEM_TYPES } from '#shared/constants/site-items';

useHead({ title: 'Version history' });
const route = useRoute();

const { filter, page, query, reset, activeCount } = useListFilters(['type', 'site', 'startedAt', 'endedAt']);
const typeFilter = filter('type');
const siteFilter = filter('site');
const startedAtFilter = filter('startedAt');
const endedAtFilter = filter('endedAt');

const typeOptions: { label: string; value: string }[] = SITE_ITEM_TYPES.map((type) => ({
  label: siteItemTypeLabel(type),
  value: type,
}));

const siteSearchTerm = shallowRef('');
const sitesQuery = computed(() => ({ q: siteSearchTerm.value || undefined }));
const sitesLoaded = shallowRef(siteFilter.value.length > 0);
const {
  data: sitesData,
  error: sitesError,
  status: sitesStatus,
  refresh: refreshSites,
} = useFetch('/api/sites', {
  query: sitesQuery,
  immediate: sitesLoaded.value,
  watch: false,
  retry: 0,
});

const contextualSiteId = siteFilter.value[0];
const rawContextualSiteName = route.query.siteName;
const contextualSiteName = Array.isArray(rawContextualSiteName)
  ? rawContextualSiteName[0]
  : rawContextualSiteName;
const siteOptions = computed(() => {
  const options = (sitesData.value?.items ?? []).map((site) => ({
    label: site.name,
    value: site.id,
  }));

  for (const [index, selectedId] of siteFilter.value.entries()) {
    if (options.some((option) => String(option.value) === selectedId)) {
      continue;
    }

    const label = index === 0 && selectedId === contextualSiteId && contextualSiteName
      ? contextualSiteName
      : siteFilter.value.length === 1 ? 'Selected site' : `Selected site ${index + 1}`;
    options.unshift({ label, value: selectedId });
  }

  return options;
});

async function handleSiteMenuOpen(open: boolean): Promise<void> {
  if (!open) {
    return;
  }

  sitesLoaded.value = true;
  await refreshSites();
}

watch(siteSearchTerm, () => {
  if (sitesLoaded.value) {
    void refreshSites();
  }
});

watch(sitesError, (value) => {
  if (value) {
    notifyApiError(value);
  }
});

const startedAt = computed<string>({
  get: () => startedAtFilter.value[0] ?? '',
  set: (value) => {
    startedAtFilter.value = value ? [value] : [];
  },
});

const endedAt = computed<string>({
  get: () => endedAtFilter.value[0] ?? '',
  set: (value) => {
    endedAtFilter.value = value ? [value] : [];
  },
});

const { data, status, error, refresh } = useFetch('/api/site-items/history', {
  query,
  retry: 0,
});

const history = computed(() => data.value?.items ?? []);
const isLoading = computed(() => status.value === 'pending');
const total = computed(() => data.value?.meta.total ?? history.value.length);

watch(error, (value) => {
  if (value) {
    notifyApiError(value);
  }
});

const columns: TableColumn<SiteItemHistory>[] = [
  { id: 'event', header: 'Change' },
  { id: 'versions', header: 'Versions' },
  { id: 'created_at', header: 'Recorded' },
];

const contextSiteNames = computed(() => siteFilter.value.flatMap((siteId) => {
  const option = siteOptions.value.find((candidate) => String(candidate.value) === siteId);
  return option ? [option.label] : [];
}));
const contextVisible = computed(() => siteFilter.value.length > 0);

function siteContextLabel(): string {
  if (contextSiteNames.value.length > 0) {
    return contextSiteNames.value.join(', ');
  }

  return `${siteFilter.value.length} selected ${siteFilter.value.length === 1 ? 'site' : 'sites'}`;
}
</script>

<template>
  <AppNavbar title="Version history">
    <template #trailing>
      <USeparator orientation="vertical" class="hidden h-3.5 sm:block" />
      <span class="hidden min-w-0 truncate text-meta text-muted sm:block">Recorded component version changes</span>
      <span v-if="data" class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ total }}</span>
    </template>
  </AppNavbar>

  <ManagerNavigation />

  <UDashboardToolbar>
    <template #left>
      <USelectMenu
        v-model="typeFilter"
        :items="typeOptions"
        value-key="value"
        :multiple="true"
        icon="i-lucide-package"
        placeholder="Type"
        aria-label="Filter by type"
        class="w-full sm:w-40"
      />
      <USelectMenu
        v-model="siteFilter"
        v-model:search-term="siteSearchTerm"
        :items="siteOptions"
        value-key="value"
        :multiple="true"
        ignore-filter
        :loading="sitesStatus === 'pending'"
        :disabled="!!sitesError"
        searchable
        icon="i-lucide-globe"
        :placeholder="sitesError ? 'Sites unavailable' : 'Search or select sites'"
        aria-label="Filter by site"
        class="w-full sm:w-52"
        @update:open="handleSiteMenuOpen"
      />
      <UInput
        v-model="startedAt"
        type="date"
        icon="i-lucide-calendar"
        aria-label="Start date"
        class="w-full sm:w-44"
      />
      <UInput
        v-model="endedAt"
        type="date"
        icon="i-lucide-calendar"
        aria-label="End date"
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
      Context: {{ siteContextLabel() }}
    </p>

    <UCard v-if="error" :ui="{ body: 'p-0 sm:p-0' }">
      <AppErrorState :error="error" size="lg" :retry="refresh" />
    </UCard>

    <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="history"
        :columns="columns"
        :loading="isLoading"
        loading-color="primary"
        loading-animation="carousel"
      >
        <template #empty>
          <UEmpty
            :title="activeCount > 0 ? 'No version changes match these filters' : 'No version changes yet'"
            description="Recorded upgrades and downgrades appear here."
          />
        </template>

        <template #event-cell="{ row }">
          <UBadge
            :color="row.original.event === 'upgraded' ? 'success' : 'neutral'"
            variant="soft"
            size="sm"
            :label="sentenceCase(row.original.event)"
          />
        </template>

        <template #versions-cell="{ row }">
          <span class="font-mono text-mono text-toned">{{ row.original.from_version ?? '—' }} → {{ row.original.to_version ?? '—' }}</span>
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
