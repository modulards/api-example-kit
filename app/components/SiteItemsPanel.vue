<script setup lang="ts">
import type { SiteItemStatus, SiteItemType } from '#shared/constants/site-items';
import { SITE_ITEM_STATUSES, SITE_ITEM_TYPES } from '#shared/constants/site-items';

const TYPE_LABEL: Record<SiteItemType, string> = {
  core: 'Core',
  plugin: 'Plugin',
  theme: 'Theme',
};

function siteItemTypeLabel(type: string | null): string {
  if (type === null) {
    return 'No type';
  }

  return TYPE_LABEL[type as SiteItemType] ?? type;
}

const STATUS_LABEL: Record<SiteItemStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  uninstalled: 'Uninstalled',
};

function siteItemStatusLabel(status: string | null): string {
  if (status === null) {
    return 'No status';
  }

  return STATUS_LABEL[status as SiteItemStatus] ?? status;
}

interface SiteItemsResponse {
  items: SiteItem[];
  meta: Page<SiteItem>['meta'];
}

const props = defineProps<{
  site: Site;
}>();

const typeOptions = SITE_ITEM_TYPES.map((value) => ({ label: siteItemTypeLabel(value), value }));
const statusOptions = SITE_ITEM_STATUSES.map((value) => ({ label: siteItemStatusLabel(value), value }));

// Unlike list pages, these filters stay local: the site record's URL already identifies the view.
const types = ref<SiteItemType[]>([]);
const statuses = ref<SiteItemStatus[]>([]);
const page = ref(1);

const activeCount = computed(() => types.value.length + statuses.value.length);

function resetFilters(): void {
  types.value = [];
  statuses.value = [];
}

// A narrower filter can leave the current page out of range, so it goes back to page 1.
watch([types, statuses], () => {
  page.value = 1;
});

const query = computed(() => ({
  site: [props.site.id],
  type: types.value,
  status: statuses.value,
  page: page.value,
}));

const { data, error, status, refresh } = useFetch<SiteItemsResponse>(
  () => '/api/site-items',
  { query, retry: 0 },
);

const items = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const isLoading = computed(() => status.value === 'pending');
const totalLabel = computed(() => (total.value === 1 ? '1 item' : `${total.value} items`));
const actionModalOpen = ref(false);
const actionRequest = ref<ManagerActionRequest | null>(null);
const actionType = ref<SiteItemType | undefined>(undefined);
const actionComponentName = ref<string | undefined>(undefined);
const allowedUpgradeModes = ref<('safe_upgrade' | 'upgrade')[]>([]);
const dispatchResult = ref<ManagerDispatchResult | null>(null);
const { remember } = usePendingActions();

function requestAction(
  request: ManagerActionRequest,
  modes: ('safe_upgrade' | 'upgrade')[] = [],
): void {
  const item = items.value.find(
    (candidate) => candidate.component_id !== null && String(candidate.component_id) === request.componentId,
  );
  actionType.value = item?.type ?? undefined;
  actionComponentName.value = item?.name ?? item?.basename;
  allowedUpgradeModes.value = modes;
  actionRequest.value = request;
  actionModalOpen.value = true;
}

function onDispatched(result: ManagerDispatchResult): void {
  const actions = result.actions.map((action) => {
    if (action.site || action.site_id === null || String(action.site_id) !== String(props.site.id)) {
      return action;
    }

    return {
      ...action,
      site: { id: String(props.site.id), name: props.site.name },
    };
  });

  dispatchResult.value = { ...result, actions };
  remember(actions, actionComponentName.value);
  void refresh();
  actionModalOpen.value = false;
}

function onInspect(siteItemId: string): void {
  void navigateTo(`/manager/inventory/${siteItemId}`);
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Manager</h2>
      <div class="grow" />
      <span v-if="data" class="font-mono text-mono-sm text-dimmed">{{ totalLabel }}</span>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-refresh-cw"
        :aria-label="`Refresh Manager items for ${site.name}`"
        :loading-auto="true"
        @click="() => refresh()"
      />
    </template>

    <UDashboardToolbar :ui="{ root: 'px-4 sm:px-4 py-3' }">
      <template #left>
        <USelectMenu
          v-model="types"
          :items="typeOptions"
          value-key="value"
          :multiple="true"
          icon="i-lucide-puzzle"
          placeholder="Type"
          aria-label="Filter by type"
          class="w-full sm:w-44"
        />
        <USelectMenu
          v-model="statuses"
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
        <UButton
          v-if="activeCount > 0"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          label="Clear filters"
          @click="resetFilters"
        />
      </template>
    </UDashboardToolbar>

    <AppErrorState v-if="error" :error="error" :retry="refresh" />

    <ManagerItemsTable
      v-else
      :items="items"
      :loading="isLoading"
      :site-context="site"
      @inspect="onInspect"
      @request-action="requestAction"
    />

    <ManagerDispatchPanel
      :result="dispatchResult"
      :site-context="site"
    />

    <template v-if="data && !error && total > 0" #footer>
      <AppPaginationFooter v-model:page="page" :total="total" :per-page="data.meta.perPage" />
    </template>
  </UCard>
  <ManagerActionModal
    v-model:open="actionModalOpen"
    :request="actionRequest"
    :component-type="actionType"
    :component-name="actionComponentName"
    :allowed-upgrade-modes="allowedUpgradeModes"
    @dispatched="onDispatched"
  />
</template>
