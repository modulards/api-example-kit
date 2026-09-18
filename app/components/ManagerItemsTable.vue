<script setup lang="ts">
import type { DropdownMenuItem, TableColumn, TableRow } from '@nuxt/ui';
import type { ManagerActionRequest } from '#shared/types/modular';

type UpgradeMode = 'safe_upgrade' | 'upgrade';
type BulkAction = ManagerActionRequest['action'];
const MAX_SELECTED_SITES = 200;

const props = defineProps<{
  items: SiteItem[];
  loading: boolean;
  /** Hides the Site column and prefills row actions with this site. */
  siteContext?: Site | null;
  componentContext?: { id: string; name: string } | null;
  filtered?: boolean;
  /** Any change clears the selection. */
  selectionKey?: string;
}>();

const emit = defineEmits<{
  inspect: [siteItemId: string];
  requestAction: [request: ManagerActionRequest, allowedUpgradeModes?: UpgradeMode[]];
}>();

const selectedSiteIds = shallowRef<number[]>([]);
const openActionItemId = shallowRef<string | null>(null);

function clearSelection(): void {
  selectedSiteIds.value = [];
}

watch([() => props.items, () => props.selectionKey, () => props.componentContext?.id], clearSelection);

const columns = computed<TableColumn<SiteItem>[]>(() => {
  if (props.componentContext) {
    return [
      { id: 'select', header: '' },
      { id: 'site', header: 'Site', meta: { class: { th: 'w-[240px]', td: 'w-[240px]' } } },
      { id: 'version', header: 'Installed', meta: { class: { th: 'w-[130px]', td: 'w-[130px]' } } },
      { id: 'new_version', header: 'Available', meta: { class: { th: 'w-[130px]', td: 'w-[130px]' } } },
      { id: 'status', header: 'Status', meta: { class: { th: 'w-[140px]', td: 'w-[140px]' } } },
      { id: 'vulnerabilities', header: 'Vulnerabilities' },
      { id: 'actions', header: '' },
    ];
  }

  const tableColumns: TableColumn<SiteItem>[] = [
    { id: 'name', header: 'Item', meta: { class: { th: 'w-[300px]', td: 'w-[300px] max-w-[300px]' } } },
    { id: 'type', header: 'Type', meta: { class: { th: 'w-[110px]', td: 'w-[110px]' } } },
    { id: 'status', header: 'Status', meta: { class: { th: 'w-[140px]', td: 'w-[140px]' } } },
    { id: 'version', header: 'Version', meta: { class: { th: 'w-[120px]', td: 'w-[120px]' } } },
    { id: 'new_version', header: 'Available', meta: { class: { th: 'w-[140px]', td: 'w-[140px]' } } },
    { id: 'vulnerabilities', header: 'Vulnerabilities' },
  ];

  if (!props.siteContext) {
    tableColumns.push({ id: 'site', header: 'Site', meta: { class: { th: 'w-[170px]', td: 'w-[170px]' } } });
  }

  tableColumns.push({ id: 'actions', header: '' });
  return tableColumns;
});

function itemName(item: SiteItem): string {
  return item.name ?? item.basename;
}

function siteIdOf(item: SiteItem): number | null {
  const rawId = props.siteContext?.id ?? item.site?.id;
  const siteId = Number(rawId);
  return Number.isSafeInteger(siteId) && siteId > 0 ? siteId : null;
}

function initialSiteIds(item: SiteItem): number[] {
  const siteId = siteIdOf(item);
  return siteId === null ? [] : [siteId];
}

function initialSites(item: SiteItem): { id: string; name: string }[] {
  const site = props.siteContext ?? item.site;
  const siteId = siteIdOf(item);
  const name = site?.name?.trim();

  return siteId === null || !name ? [] : [{ id: String(siteId), name }];
}

function upgradeModesFor(item: SiteItem): UpgradeMode[] {
  const modes: UpgradeMode[] = [];

  if (item.can_safe_upgrade === true) {
    modes.push('safe_upgrade');
  }

  if (item.can_upgrade === true) {
    modes.push('upgrade');
  }

  return modes;
}

function supportsAction(item: SiteItem, action: BulkAction): boolean {
  switch (action) {
    case 'safe_upgrade': return item.can_safe_upgrade === true;
    case 'upgrade': return item.can_upgrade === true;
    case 'activate': return item.can_activate === true;
    case 'deactivate': return item.can_deactivate === true;
    case 'uninstall': return item.can_delete === true;
  }
}

function hasManagerAction(item: SiteItem): boolean {
  return upgradeModesFor(item).length > 0
    || item.can_activate === true
    || item.can_deactivate === true
    || item.can_delete === true;
}

function selectionUnavailableReason(item: SiteItem): string | null {
  if (item.component_id === null) {
    return 'This installation is not linked to a component.';
  }

  if (props.componentContext && String(item.component_id) !== props.componentContext.id) {
    return 'This installation does not belong to this component.';
  }

  if (siteIdOf(item) === null) {
    return 'This installation is not linked to an actionable site.';
  }

  if (!hasManagerAction(item)) {
    return 'No Manager actions are available for this installation.';
  }

  return null;
}

function isSelected(item: SiteItem): boolean {
  const siteId = siteIdOf(item);
  return siteId !== null && selectedSiteIds.value.includes(siteId);
}

function checkboxUnavailableReason(item: SiteItem): string | null {
  const reason = selectionUnavailableReason(item);

  if (reason) {
    return reason;
  }

  if (!isSelected(item) && selectedSiteIds.value.length >= MAX_SELECTED_SITES) {
    return `Select no more than ${MAX_SELECTED_SITES} installations.`;
  }

  return null;
}

const eligibleItems = computed(() => props.componentContext
  ? props.items.filter((item) => selectionUnavailableReason(item) === null)
  : []);
const eligibleSiteIds = computed(() => [...new Set(eligibleItems.value.flatMap((item) => {
  const siteId = siteIdOf(item);
  return siteId === null ? [] : [siteId];
}))]);
const selectedItems = computed(() => {
  const selected = new Set(selectedSiteIds.value);
  return props.items.filter((item) => {
    const siteId = siteIdOf(item);
    return siteId !== null && selected.has(siteId);
  });
});
const hasVisibleSelection = computed(() => selectedSiteIds.value.length > 0);
const visibleSelectionState = computed<boolean | 'indeterminate'>(() => {
  if (!hasVisibleSelection.value) {
    return false;
  }

  return selectedSiteIds.value.length === eligibleSiteIds.value.length ? true : 'indeterminate';
});
const allowedUpgradeModes = computed<UpgradeMode[]>(() => {
  if (selectedItems.value.length === 0) {
    return [];
  }

  return (['safe_upgrade', 'upgrade'] as const)
    .filter((mode) => selectedItems.value.every((item) => supportsAction(item, mode)));
});

function toggleVisible(): void {
  if (hasVisibleSelection.value) {
    clearSelection();
    return;
  }

  selectedSiteIds.value = eligibleSiteIds.value.slice(0, MAX_SELECTED_SITES);
}

function toggleItem(item: SiteItem, checked: boolean): void {
  const siteId = siteIdOf(item);

  if (siteId === null || (!checked && !selectedSiteIds.value.includes(siteId))) {
    return;
  }

  if (checked && checkboxUnavailableReason(item) !== null) {
    return;
  }

  selectedSiteIds.value = checked
    ? [...new Set([...selectedSiteIds.value, siteId])]
    : selectedSiteIds.value.filter((selectedId) => selectedId !== siteId);
}

function requestAction(action: BulkAction, item: SiteItem): void {
  emit('requestAction', {
    action,
    componentId: String(item.component_id),
    initialSiteIds: initialSiteIds(item),
    initialSites: initialSites(item),
  }, upgradeModesFor(item));
}

function actionEntry(item: SiteItem, action: BulkAction, label: string, icon: string, color?: 'error'): DropdownMenuItem {
  const targetAvailable = item.component_id !== null && siteIdOf(item) !== null;

  if (targetAvailable && supportsAction(item, action)) {
    return {
      label,
      icon,
      color,
      onSelect: (event: Event) => {
        event.stopPropagation();
        requestAction(action, item);
      },
    };
  }

  const unavailableLabel = targetAvailable ? `${label} unavailable` : `${label} — installation unavailable`;
  return { label: unavailableLabel, icon, color, disabled: true };
}

function actionsFor(item: SiteItem): DropdownMenuItem[] {
  return [
    {
      label: 'Inspect',
      icon: 'i-lucide-search',
      onSelect: (event: Event) => {
        event.stopPropagation();
        emit('inspect', item.id);
      },
    },
    actionEntry(item, 'safe_upgrade', 'Safe upgrade', 'i-lucide-shield-check'),
    actionEntry(item, 'upgrade', 'Upgrade', 'i-lucide-arrow-up-circle'),
    actionEntry(item, 'activate', 'Activate', 'i-lucide-power'),
    actionEntry(item, 'deactivate', 'Deactivate', 'i-lucide-power-off'),
    actionEntry(item, 'uninstall', 'Uninstall', 'i-lucide-trash-2', 'error'),
  ];
}

function setActionMenuOpen(itemId: string, open: boolean): void {
  if (open) {
    openActionItemId.value = itemId;
  } else if (openActionItemId.value === itemId) {
    openActionItemId.value = null;
  }
}

function onRowSelect(_event: Event, row: TableRow<SiteItem>): void {
  if (props.siteContext) {
    openActionItemId.value = row.original.id;
  }
}

function onTableKeydown(event: KeyboardEvent): void {
  if (!props.siteContext || (event.key !== 'Enter' && event.key !== ' ')) {
    return;
  }

  const target = event.target;

  if (!(target instanceof HTMLElement) || target.closest('button, a, input, select, textarea, [role="menuitem"]')) {
    return;
  }

  const row = target.closest<HTMLTableRowElement>('tbody tr[role="button"]');
  const item = row ? props.items[row.sectionRowIndex] : undefined;

  if (!item) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  openActionItemId.value = item.id;
}

function canDispatchSelected(action: BulkAction): boolean {
  return selectedItems.value.length > 0 && selectedItems.value.every((item) => supportsAction(item, action));
}

function bulkActionReason(action: BulkAction): string {
  if (selectedItems.value.length === 0) {
    return 'Select at least one installation.';
  }

  if (action === 'safe_upgrade' || action === 'upgrade') {
    return allowedUpgradeModes.value.length === 0
      ? 'The selected installations do not share an update mode.'
      : '';
  }

  return canDispatchSelected(action) ? '' : 'This action is not available for every selected installation.';
}

function bulkActionAriaLabel(label: string, action: BulkAction): string {
  const reason = bulkActionReason(action);
  return reason ? `${label}. ${reason}` : label;
}

function requestSelectedUpdate(): void {
  const action = allowedUpgradeModes.value[0];

  if (!action) {
    return;
  }

  requestSelected(action, allowedUpgradeModes.value);
}

function requestSelected(action: BulkAction, modes: UpgradeMode[] = []): void {
  const component = props.componentContext;

  if (!component || selectedItems.value.length === 0) {
    return;
  }

  if (action === 'safe_upgrade' || action === 'upgrade') {
    if (!allowedUpgradeModes.value.includes(action)) {
      return;
    }
  } else if (!canDispatchSelected(action)) {
    return;
  }

  emit('requestAction', {
    action,
    componentId: component.id,
    initialSiteIds: [...selectedSiteIds.value],
    initialSites: selectedItems.value.flatMap(initialSites),
  }, modes);
}
</script>

<template>
  <div>
    <div
      v-if="componentContext"
      class="flex min-h-14 flex-wrap items-center gap-2 border-b border-default px-4 py-2.5"
    >
      <span class="mr-auto text-meta text-muted">
        <strong class="font-medium text-highlighted">{{ selectedSiteIds.length }}</strong> selected
      </span>
      <UButton
        label="Update selected"
        icon="i-lucide-arrow-up-circle"
        :disabled="allowedUpgradeModes.length === 0"
        :title="bulkActionReason('upgrade')"
        :aria-label="bulkActionAriaLabel('Update selected', 'upgrade')"
        @click="requestSelectedUpdate"
      />
      <UButton
        label="Activate"
        icon="i-lucide-power"
        color="neutral"
        variant="outline"
        :disabled="!canDispatchSelected('activate')"
        :title="bulkActionReason('activate')"
        :aria-label="bulkActionAriaLabel('Activate selected', 'activate')"
        @click="requestSelected('activate')"
      />
      <UButton
        label="Deactivate"
        icon="i-lucide-power-off"
        color="neutral"
        variant="outline"
        :disabled="!canDispatchSelected('deactivate')"
        :title="bulkActionReason('deactivate')"
        :aria-label="bulkActionAriaLabel('Deactivate selected', 'deactivate')"
        @click="requestSelected('deactivate')"
      />
      <UButton
        label="Uninstall"
        icon="i-lucide-trash-2"
        color="error"
        variant="outline"
        :disabled="!canDispatchSelected('uninstall')"
        :title="bulkActionReason('uninstall')"
        :aria-label="bulkActionAriaLabel('Uninstall selected', 'uninstall')"
        @click="requestSelected('uninstall')"
      />
    </div>

    <div class="overflow-x-auto">
      <UTable
        :data="items"
        :columns="columns"
        :loading="loading"
        loading-color="primary"
        loading-animation="carousel"
        :ui="{ th: 'px-4', td: 'px-4' }"
        :on-select="siteContext ? onRowSelect : undefined"
        @keydown="onTableKeydown"
      >
        <template v-if="componentContext" #select-header>
          <UCheckbox
            :model-value="visibleSelectionState"
            :disabled="eligibleItems.length === 0"
            aria-label="Select actionable visible installations"
            @update:model-value="toggleVisible"
            @click.stop
          />
        </template>

        <template v-if="componentContext" #select-cell="{ row }">
          <UCheckbox
            :model-value="isSelected(row.original)"
            :disabled="checkboxUnavailableReason(row.original) !== null"
            :title="checkboxUnavailableReason(row.original) ?? undefined"
            :aria-label="checkboxUnavailableReason(row.original) ? `Cannot select ${row.original.site?.name ?? 'installation'}: ${checkboxUnavailableReason(row.original)}` : `Select ${row.original.site?.name ?? 'installation'}`"
            @update:model-value="toggleItem(row.original, $event === true)"
            @click.stop
          />
        </template>

        <template #name-cell="{ row }">
          <div class="flex min-w-0 flex-col leading-tight">
            <span class="truncate text-row font-medium text-highlighted">{{ itemName(row.original) }}</span>
            <span v-if="row.original.slug" class="truncate font-mono text-mono-sm text-muted">{{ row.original.slug }}</span>
          </div>
        </template>

        <template #type-cell="{ row }">
          <span class="text-meta text-muted">{{ siteItemTypeLabel(row.original.type) }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="siteItemStatusTone(row.original.status)" variant="soft" :label="siteItemStatusLabel(row.original.status)" />
        </template>

        <template #version-cell="{ row }">
          <span class="font-mono text-mono text-toned">{{ row.original.version ?? '—' }}</span>
        </template>

        <template #new_version-cell="{ row }">
          <span v-if="row.original.new_version" class="font-mono text-mono text-toned">{{ row.original.new_version }}</span>
          <span v-else class="text-dimmed">—</span>
        </template>

        <template #vulnerabilities-cell="{ row }">
          <UBadge v-if="row.original.vulnerabilities_c_exists === true" color="error" variant="subtle" label="Severe" />
          <UBadge v-else-if="row.original.vulnerabilities_exists === true" color="warning" variant="subtle" label="Reported" />
          <span v-else class="text-dimmed">—</span>
        </template>

        <template #site-cell="{ row }">
          <NuxtLink
            v-if="row.original.site"
            :to="`/sites/${row.original.site.id}`"
            class="truncate text-row font-medium text-highlighted transition-colors hover:text-primary"
            @click.stop
          >
            {{ row.original.site.name ?? '—' }}
          </NuxtLink>
          <span v-else class="text-dimmed">Site unavailable</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UDropdownMenu
              :open="siteContext ? openActionItemId === row.original.id : undefined"
              :items="actionsFor(row.original)"
              @update:open="setActionMenuOpen(row.original.id, $event)"
            >
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                square
                :aria-label="`Actions for ${componentContext?.name ?? itemName(row.original)}`"
                @click.stop
                @keydown.stop
              />
            </UDropdownMenu>
          </div>
        </template>

        <template #empty>
          <UEmpty
            :icon="componentContext ? 'i-lucide-globe' : filtered ? 'i-lucide-search-x' : 'i-lucide-package'"
            :title="componentContext ? 'No visible installations' : filtered ? 'No items match these filters' : 'Nothing installed yet'"
            :description="componentContext ? 'This component has no visible site installations.' : filtered ? 'Clear the active filters to see the whole Manager list.' : 'Items appear here once sites report their installed components.'"
            size="lg"
          />
        </template>
      </UTable>
    </div>
  </div>
</template>
