<script setup lang="ts">
import type { ManagerActionRequest, ManagerDispatchResult, Page, SiteItem, SiteItemsSummary } from '#shared/types/modular';
import type { SiteItemStatus, SiteItemType } from '#shared/constants/site-items';
import { SITE_ITEM_STATUSES, SITE_ITEM_TYPES } from '#shared/constants/site-items';

interface SiteItemsResponse {
  items: SiteItem[];
  meta: Page<SiteItem>['meta'];
}

interface SiteItemsSummaryResponse {
  summary: SiteItemsSummary;
}

const { filter, page, query, activeCount } = useListFilters(['q', 'component', 'type', 'status', 'updateAvailable', 'hasVulnerabilities']);

const router = useRouter();

const searchFilter = filter('q');
const searchInput = ref(searchFilter.value[0] ?? '');

function applySearch(): void {
  searchFilter.value = searchInput.value ? [searchInput.value] : [];
}

watch(searchFilter, (value) => {
  searchInput.value = value[0] ?? '';
});

const typeOptions: { label: string; value: SiteItemType }[] = SITE_ITEM_TYPES
  .map((value) => ({ label: siteItemTypeLabel(value), value }));
const statusOptions: { label: string; value: SiteItemStatus }[] = SITE_ITEM_STATUSES
  .map((value) => ({ label: siteItemStatusLabel(value), value }));

const advancedCount = computed(() =>
  Number(updateAvailable.value !== '') + Number(hasVulnerabilities.value !== ''),
);

const typeFilter = filter('type');
const statusFilter = filter('status');

const typeFilterComputed = computed<SiteItemType[]>({
  get: () => typeFilter.value as SiteItemType[],
  set: (values) => {
    typeFilter.value = values;
  },
});

const statusModel = computed<SiteItemStatus[]>({
  get: () => statusFilter.value as SiteItemStatus[],
  set: (values) => {
    statusFilter.value = values;
  },
});

const TERNARY_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Yes', value: '1' },
  { label: 'No', value: '0' },
];

const updateFilter = filter('updateAvailable');
const hasVulnerabilitiesFilter = filter('hasVulnerabilities');

const updateAvailable = computed<'' | '1' | '0'>({
  get: () => {
    const value = updateFilter.value[0];
    return value === '1' || value === '0' ? value : '';
  },
  set: (value) => {
    updateFilter.value = value === '1' ? ['1'] : value === '0' ? ['0'] : [];
  },
});

const hasVulnerabilities = computed<'' | '1' | '0'>({
  get: () => {
    const value = hasVulnerabilitiesFilter.value[0];
    return value === '1' || value === '0' ? value : '';
  },
  set: (value) => {
    hasVulnerabilitiesFilter.value = value === '1' ? ['1'] : value === '0' ? ['0'] : [];
  },
});

const componentFilter = filter('component');

function resetInventoryFilters(): void {
  const componentId = componentFilter.value[0];
  void router.replace({ query: componentId ? { component: componentId } : {} });
}

const summaryQuery = computed(() => {
  const { page: _page, ...filters } = query.value;
  return filters;
});

const summaryKey = computed(() => JSON.stringify(summaryQuery.value));
const summaryEnabled = computed(() => componentFilter.value.length === 0);

const { data: summaryData, status: summaryStatus, error: summaryError, refresh: summaryRefresh } = useFetch<SiteItemsSummaryResponse>('/api/site-items/summary', {
  query: summaryQuery,
  watch: false,
  enabled: summaryEnabled,
  retry: 0,
});

watch(summaryKey, () => {
  if (summaryEnabled.value) {
    void summaryRefresh();
  }
});

const { data, status, error, refresh } = useFetch<SiteItemsResponse>('/api/site-items', {
  query,
  retry: 0,
});

watch(summaryError, (value) => {
  if (value) {
    notifyApiError(value);
  }
});

const summary = computed(() => summaryData.value?.summary ?? null);

const items = computed(() => data.value?.items ?? []);
const isLoading = computed(() => status.value === 'pending');
const total = computed(() => data.value?.meta.total ?? items.value.length);

watch(error, (value) => {
  if (value) {
    notifyApiError(value);
  }
});

function openItem(siteItemId: string): void {
  const query = componentId.value ? `?component=${encodeURIComponent(componentId.value)}` : '';
  void navigateTo(`/manager/inventory/${siteItemId}${query}`);
}

const componentId = computed(() => componentFilter.value[0] ?? '');
const isComponentDetail = computed(() => componentId.value.length > 0);
const clearableFilterCount = computed(() => Math.max(0, activeCount.value - (isComponentDetail.value ? 1 : 0)));
const componentItem = computed(() =>
  items.value.find((item) => item.component_id !== null && String(item.component_id) === componentId.value),
);
const componentContext = computed(() => {
  if (!isComponentDetail.value) {
    return null;
  }

  return {
    id: componentId.value,
    name: componentItem.value?.name ?? 'Component',
  };
});
useHead(() => ({
  title: isComponentDetail.value ? (componentContext.value?.name ?? 'Component') : 'Installations',
}));

const actionModalOpen = ref(false);
const actionRequest = ref<ManagerActionRequest | null>(null);
const componentType = ref<SiteItemType | null>(null);
const actionComponentName = ref<string | undefined>(undefined);
const allowedUpgradeModes = ref<('safe_upgrade' | 'upgrade')[]>([]);

// Rows of one component share its type, so the first match is enough for the modal.
function componentTypeFor(request: ManagerActionRequest): 'core' | 'plugin' | 'theme' | null {
  const row = items.value.find((item) => String(item.component_id) === request.componentId);
  return row?.type ?? null;
}

function openAction(
  request: ManagerActionRequest,
  modes: ('safe_upgrade' | 'upgrade')[] = [],
): void {
  actionRequest.value = request;
  componentType.value = componentTypeFor(request);
  actionComponentName.value = items.value.find(
    (item) => item.component_id !== null && String(item.component_id) === request.componentId,
  )?.name ?? componentContext.value?.name;
  allowedUpgradeModes.value = modes;
  actionModalOpen.value = true;
}

const dispatchResult = ref<ManagerDispatchResult | null>(null);
const { remember } = usePendingActions();

function onDispatched(result: ManagerDispatchResult): void {
  const sitesById = new Map((actionRequest.value?.initialSites ?? []).map((site) => [site.id, site]));
  const actions = result.actions.map((action) => {
    if (action.site || action.site_id === null) {
      return action;
    }

    const site = sitesById.get(String(action.site_id));
    return site ? { ...action, site } : action;
  });

  dispatchResult.value = { ...result, actions };
  remember(actions, actionComponentName.value);
  void refresh();
}
</script>

<template>
  <AppNavbar :title="isComponentDetail ? (componentContext?.name ?? 'Component') : 'Installations'">
    <template #trailing>
      <USeparator orientation="vertical" class="hidden h-3.5 sm:block" />
      <span class="hidden min-w-0 truncate text-meta text-muted sm:block">
        {{ isComponentDetail ? 'Installations of this component' : 'Components installed across every site' }}
      </span>
      <span class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ total }}</span>
    </template>
  </AppNavbar>

  <ManagerNavigation />

  <UDashboardToolbar>
    <template #left>
      <UInput
        v-if="!isComponentDetail"
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="Search installations, then press Enter"
        aria-label="Search installations"
        class="w-full sm:w-64"
        @keydown.enter="applySearch"
      />
      <USelectMenu
        v-if="!isComponentDetail"
        v-model="typeFilterComputed"
        :items="typeOptions"
        value-key="value"
        :multiple="true"
        icon="i-lucide-puzzle"
        placeholder="Type"
        aria-label="Filter by type"
        class="w-full sm:w-44"
      />
      <USelectMenu
        v-model="statusModel"
        :items="statusOptions"
        value-key="value"
        :multiple="true"
        icon="i-lucide-toggle-left"
        placeholder="Status"
        aria-label="Filter by status"
        class="w-full sm:w-44"
      />
    </template>

    <template #right>
      <UPopover :content="{ align: 'end' }">
        <UButton color="neutral" variant="outline" icon="i-lucide-sliders-horizontal" label="Filters" aria-label="More filters">
          <template #trailing>
            <UBadge v-if="advancedCount > 0" color="primary" variant="subtle" size="sm" :label="String(advancedCount)" />
          </template>
        </UButton>

        <template #content>
          <div class="flex w-72 flex-col gap-4 p-4">
            <UFormField label="Updates available">
              <USelectMenu
                v-model="updateAvailable"
                :items="TERNARY_OPTIONS"
                value-key="value"
                icon="i-lucide-refresh-cw"
                aria-label="Filter by updates available"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Vulnerabilities">
              <USelectMenu
                v-model="hasVulnerabilities"
                :items="TERNARY_OPTIONS"
                value-key="value"
                icon="i-lucide-shield-alert"
                aria-label="Filter by vulnerabilities"
                class="w-full"
              />
            </UFormField>
          </div>
        </template>
      </UPopover>
      <UButton
        v-if="isComponentDetail"
        to="/manager"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        label="Back to Manager"
      />

      <UButton
        v-if="clearableFilterCount > 0"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        label="Clear filters"
        @click="resetInventoryFilters"
      />
    </template>
  </UDashboardToolbar>

  <div class="flex flex-col gap-5 px-4 py-6 sm:px-6">
    <template v-if="!isComponentDetail">
      <UCard v-if="summaryError" :ui="{ body: 'p-0 sm:p-0' }">
        <AppErrorState :error="summaryError" :retry="summaryRefresh" />
      </UCard>
      <ManagerItemsSummary v-else :summary="summary" :loading="summaryStatus === 'pending'" />
    </template>

    <ManagerDispatchPanel
      :result="dispatchResult"
      :component-name="isComponentDetail ? (componentContext?.name ?? undefined) : undefined"
    />

    <UCard v-if="error" :ui="{ body: 'p-0 sm:p-0' }">
      <AppErrorState :error="error" size="lg" :retry="refresh" />
    </UCard>

    <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
      <ManagerItemsTable
        :items="items"
        :loading="isLoading"
        :site-context="null"
        :component-context="componentContext"
        :filtered="activeCount > 0"
        :selection-key="JSON.stringify(query)"
        @inspect="openItem"
        @request-action="openAction"
      />

      <template v-if="data && total > 0" #footer>
        <AppPaginationFooter v-model:page="page" :total="total" :per-page="data.meta.perPage" />
      </template>
    </UCard>
    <ManagerActionModal
      v-model:open="actionModalOpen"
      :request="actionRequest"
      :component-type="componentType"
      :component-name="actionComponentName"
      :allowed-upgrade-modes="allowedUpgradeModes"
      @dispatched="onDispatched"
    />
  </div>
</template>
