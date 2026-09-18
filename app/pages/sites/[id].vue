<script setup lang="ts">
import type { NuxtError } from '#app';
import type { BreadcrumbItem, TabsItem } from '@nuxt/ui';
import { connectionStatusLabel, connectionStatusTone } from '#shared/constants/connection-status';

interface SiteDetailResponse {
  site: Site;
}

const route = useRoute();
const router = useRouter();

const id = computed(() => {
  const raw = route.params.id;
  return Array.isArray(raw) ? (raw[0] ?? '') : raw;
});

const { data, error, status, refresh } = useFetch<SiteDetailResponse, NuxtError>(
  () => `/api/sites/${id.value}`,
  { retry: 0 },
);

const site = computed(() => data.value?.site);
const siteUrl = computed(() => toAbsoluteHttpUrl(site.value?.uri));

const pending = computed(() => status.value === 'pending');

const errorInfo = computed(() => {
  const err = error.value;

  if (!err) {
    return null;
  }

  return { isNotFound: (err.statusCode ?? 500) === 404 };
});

useHead(() => ({
  title: site.value?.name ?? 'Site',
}));

const SITE_TAB_VALUES = ['overview', 'uptime', 'inventory', 'maintenance', 'connection'] as const;

type SiteTabValue = typeof SITE_TAB_VALUES[number];

const DEFAULT_TAB: SiteTabValue = 'overview';

const TAB_ITEMS: TabsItem[] = [
  { value: 'overview', label: 'Overview', icon: 'i-lucide-layout-panel-left', slot: 'overview' },
  { value: 'uptime', label: 'Uptime', icon: 'i-lucide-activity', slot: 'uptime' },
  { value: 'inventory', label: 'Manager', icon: 'i-lucide-package', slot: 'inventory' },
  { value: 'maintenance', label: 'Maintenance', icon: 'i-lucide-wrench', slot: 'maintenance' },
  { value: 'connection', label: 'Connection', icon: 'i-lucide-plug', slot: 'connection' },
];

function toTabValue(raw: unknown): SiteTabValue {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return SITE_TAB_VALUES.find((tab) => tab === value) ?? DEFAULT_TAB;
}

// Unlike list filters, the tab uses `push` so the back button undoes a tab switch.
const activeTab = computed<SiteTabValue>({
  get: () => toTabValue(route.query.tab),
  set: (next) => {
    if (next === toTabValue(route.query.tab)) {
      return;
    }

    router.push({
      query: { ...route.query, tab: next === DEFAULT_TAB ? undefined : next },
    });
  },
});

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: 'Sites', to: '/sites' },
  { label: site.value?.name ?? 'Site' },
]);

const formOpen = ref(false);
const deleteOpen = ref(false);
const deleteNameInput = ref('');
const deleting = ref(false);

interface SiteSavedResult {
  siteId: string;
  connectionRequired: boolean;
}

// The update response has no relationships, so the site is fetched again. A new URI needs
// reconnecting, so the connection tab opens. https://api.docs.modulards.com/modular-ds-public-api/sites/update-site
async function onSiteSaved(result: SiteSavedResult): Promise<void> {
  if (result.connectionRequired) {
    activeTab.value = 'connection';
  }

  await refresh();
}

// Badges read `connection_status` from the refetched site, not from the verification result.
async function onConnectionVerified(_result: ConnectionVerification): Promise<void> {
  await refresh();
}

const canConfirmDelete = computed(() => !!site.value && deleteNameInput.value.trim() === site.value.name);

function openDelete(): void {
  deleteNameInput.value = '';
  deleteOpen.value = true;
}

async function onDeleteSite(): Promise<void> {
  const current = site.value;

  if (!current || deleting.value) {
    return;
  }

  deleting.value = true;

  try {
    await $fetch<null>(`/api/sites/${current.id}`, { method: 'DELETE' });
    deleteOpen.value = false;
    clearNuxtData('sites-list');
    await navigateTo('/sites');
  } catch (e) {
    notifyApiError(e);
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div>
    <AppNavbar>
      <template #left>
        <UBreadcrumb :items="breadcrumbItems" :ui="{ link: 'text-row', separatorIcon: 'size-3.5' }" />
      </template>
    </AppNavbar>

    <div class="px-4 py-6 sm:px-6">
      <div v-if="pending && !site" class="flex flex-col gap-5">
        <div class="flex items-center gap-4">
          <USkeleton class="size-10 rounded-panel" />
          <div class="flex flex-col gap-2">
            <USkeleton class="h-5 w-56" />
            <USkeleton class="h-3.5 w-72" />
          </div>
        </div>
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <USkeleton class="h-64 rounded-panel" />
          <USkeleton class="h-64 rounded-panel" />
        </div>
      </div>

      <template v-else-if="errorInfo && !site">
        <UEmpty
          v-if="errorInfo.isNotFound"
          icon="i-lucide-search-x"
          title="This site doesn't exist or isn't in your account"
          description="It may have been deleted, or the link may be wrong."
          size="lg"
        >
          <template #actions>
            <UButton label="Back to sites" icon="i-lucide-arrow-left" to="/sites" color="neutral" variant="subtle" />
          </template>
        </UEmpty>

        <AppErrorState v-else :error="error" size="lg" :retry="refresh">
          <template #actions>
            <UButton label="Back to sites" icon="i-lucide-arrow-left" to="/sites" color="neutral" variant="ghost" />
          </template>
        </AppErrorState>
      </template>

      <div v-else-if="site" class="flex flex-col gap-5">
        <div class="flex flex-wrap items-start gap-4">
          <UAvatar
            :alt="site.name"
            size="xl"
            :ui="{ root: 'rounded-panel ring ring-default', fallback: 'uppercase' }"
          />

          <div class="flex min-w-0 grow flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="min-w-0 break-words text-page-title font-semibold text-highlighted sm:truncate">
                {{ site.name }}
              </h1>
              <UBadge :color="connectionStatusTone(site.connection_status)" variant="soft" :label="connectionStatusLabel(site.connection_status)" />
              <UBadge v-if="pending" color="neutral" variant="subtle" label="Updating…" />
            </div>
            <div class="flex flex-wrap items-start gap-2.5 sm:items-center">
              <span class="w-full break-all font-mono text-mono text-muted sm:w-auto sm:truncate">{{ site.uri }}</span>
              <span class="hidden size-[3px] shrink-0 rounded-full bg-inverted/30 sm:block" />
              <span class="text-meta text-dimmed">
                {{ site.synced_at ? `Synced ${formatDateTime(site.synced_at)}` : 'Never synced' }}
              </span>
            </div>
          </div>

          <div class="flex w-full flex-wrap items-center gap-2 sm:ms-auto sm:w-auto sm:justify-end">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              label="Edit"
              @click="formOpen = true"
            />
            <UButton
              color="error"
              variant="outline"
              icon="i-lucide-trash-2"
              label="Delete"
              @click="openDelete"
            />
            <UButton
              v-if="siteUrl"
              :to="siteUrl"
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              color="neutral"
              icon="i-lucide-external-link"
              label="Open site"
            />
          </div>
        </div>

        <UTabs
          v-model="activeTab"
          :items="TAB_ITEMS"
          variant="link"
          color="neutral"
          class="min-w-0 gap-5"
          :ui="{ list: 'overflow-x-auto', trigger: 'shrink-0' }"
        >
          <template #overview>
            <SiteOverviewTab :site="site" @refresh-requested="refresh" />
          </template>

          <template #uptime>
            <SiteUptimePanel :site="site" />
          </template>

          <template #inventory>
            <SiteItemsPanel :site="site" />
          </template>

          <template #maintenance>
            <div class="flex flex-col gap-4">
              <SiteServiceStatusCard :site-id="site.id" :is-connected="site.is_connected" />
              <SiteMaintenanceCard :site-id="site.id" />
              <SiteNoteCard :site-id="site.id" />
              <SiteCacheClearCard :site="site" />
            </div>
          </template>

          <template #connection>
            <SiteConnectionPanel :site="site" @verified="onConnectionVerified" />
          </template>
        </UTabs>

        <SiteFormModal v-model:open="formOpen" :site="site" @saved="onSiteSaved" />

        <UModal v-model:open="deleteOpen" title="Delete site" :ui="{ content: 'max-w-[460px]' }">
          <template #body>
            <div class="flex flex-col gap-3.5">
              <div class="flex items-start gap-3">
                <UAvatar icon="i-lucide-trash-2" color="error" :ui="{ root: 'rounded-control ring ring-error/25' }" />

                <div class="flex min-w-0 flex-col gap-2">
                  <p class="text-row text-toned">
                    You are about to delete
                    <span class="font-medium text-highlighted">{{ site?.name }}</span>
                  </p>
                  <p class="text-meta text-muted">Deleting this site removes it from Modular DS. The WordPress installation keeps running; its backups and monitoring stop.</p>
                </div>
              </div>

              <p class="break-all font-mono text-mono-sm text-muted sm:truncate">{{ site?.uri }}</p>
              <UFormField label="Type the site name to confirm">
                <UInput
                  v-model="deleteNameInput"
                  class="w-full"
                  :placeholder="site?.name"
                  aria-label="Site name confirmation"
                />
              </UFormField>
            </div>
          </template>

          <template #footer>
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              :disabled="deleting"
              @click="deleteOpen = false"
            />
            <UButton
              label="Delete site"
              color="error"
              :loading="deleting"
              :disabled="!canConfirmDelete"
              @click="onDeleteSite"
            />
          </template>
        </UModal>
      </div>
    </div>
  </div>
</template>
