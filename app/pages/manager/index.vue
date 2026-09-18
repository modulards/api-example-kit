<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { ComponentDto } from '#shared/types/modular';

useHead({ title: 'Manager' });

const { filter, page, query, reset, activeCount } = useListFilters(['q', 'updateAvailable']);
const searchFilter = filter('q');
const searchInput = ref(searchFilter.value[0] ?? '');

function applySearch(): void {
  searchFilter.value = searchInput.value ? [searchInput.value] : [];
}

watch(searchFilter, (value) => {
  searchInput.value = value[0] ?? '';
});

const updateFilter = filter('updateAvailable');
const availabilityOptions = [
  { label: 'Any', value: '' },
  { label: 'Yes', value: '1' },
  { label: 'No', value: '0' },
];

const availability = computed<'' | '1' | '0'>({
  get: () => {
    const value = updateFilter.value[0];
    return value === '1' || value === '0' ? value : '';
  },
  set: (value) => {
    updateFilter.value = value === '1' ? ['1'] : value === '0' ? ['0'] : [];
  },
});

const { data, status, error, refresh } = useFetch('/api/components', {
  query,
  retry: 0,
});

const components = computed(() => data.value?.items ?? []);
const isLoading = computed(() => status.value === 'pending');
const total = computed(() => data.value?.meta.total ?? components.value.length);

watch(error, (value) => {
  if (value) {
    notifyApiError(value);
  }
});

function componentName(component: ComponentDto): string {
  return component.name ?? `Unnamed ${component.type}`;
}

function sentenceCase(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

const columns: TableColumn<ComponentDto>[] = [
  { id: 'name', header: 'Component' },
  { id: 'type', header: 'Type' },
  { id: 'latest_version', header: 'Latest' },
  { id: 'sites', header: 'Sites' },
  { id: 'vulnerabilities', header: 'Vulnerabilities' },
];
</script>

<template>
  <AppNavbar title="Manager">
    <template #trailing>
      <USeparator orientation="vertical" class="hidden h-3.5 sm:block" />
      <span class="hidden min-w-0 truncate text-meta text-muted sm:block">Components across every site</span>
      <span class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ total }}</span>
    </template>
  </AppNavbar>

  <ManagerNavigation />

  <UDashboardToolbar>
    <template #left>
      <UInput
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="Search components, then press Enter"
        aria-label="Search components"
        class="w-full sm:w-64"
        @keydown.enter="applySearch"
      />
      <USelectMenu
        v-model="availability"
        :items="availabilityOptions"
        value-key="value"
        icon="i-lucide-refresh-cw"
        placeholder="Updates available"
        aria-label="Filter by updates available"
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
    <UCard v-if="error" :ui="{ body: 'p-0 sm:p-0' }">
      <AppErrorState :error="error" size="lg" :retry="refresh" />
    </UCard>

    <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="components"
        :columns="columns"
        :loading="isLoading"
        loading-color="primary"
        loading-animation="carousel"
      >
        <template #empty>
          <UEmpty
            icon="i-lucide-puzzle"
            :description="activeCount > 0 ? 'Try other filters or clear them.' : 'Components appear after a connected site reports its inventory.'"
            size="lg"
          />
        </template>

        <template #name-cell="{ row }">
          <NuxtLink
            :to="{ path: '/manager/inventory', query: { component: String(row.original.id) } }"
            class="group block min-w-0 truncate font-medium text-highlighted transition-colors group-hover:text-primary"
          >
            {{ componentName(row.original) }}
          </NuxtLink>
        </template>

        <template #type-cell="{ row }">
          <span class="text-meta text-muted">{{ sentenceCase(row.original.type) }}</span>
        </template>

        <template #latest_version-cell="{ row }">
          <span class="font-mono text-mono text-toned">{{ row.original.latest_version ?? '—' }}</span>
        </template>

        <template #sites-cell="{ row }">
          <div class="flex min-w-0 flex-wrap items-center gap-2 text-meta text-muted">
            <span>{{ row.original.sites_total ?? 0 }} total</span>
            <UBadge
              v-if="(row.original.sites_updatable ?? 0) > 0"
              color="warning"
              variant="subtle"
              size="sm"
              :label="`${row.original.sites_updatable} updatable`"
            />
            <span v-else-if="(row.original.sites_active ?? 0) > 0" class="text-dimmed">
              {{ row.original.sites_active }} active
            </span>
          </div>
        </template>

        <template #vulnerabilities-cell="{ row }">
          <UBadge
            v-if="(row.original.vulnerabilities ?? 0) > 0"
            color="error"
            variant="subtle"
            size="sm"
            :label="`${row.original.vulnerabilities}`"
          />
          <span v-else class="text-meta text-dimmed">None</span>
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
