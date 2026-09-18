<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { connectionStatusLabel, connectionStatusTone } from '#shared/constants/connection-status';

useHead({ title: 'Sites' });

const route = useRoute();
const router = useRouter();

if ('status' in route.query) {
  const { status: _status, page: _page, ...cleanQuery } = route.query;
  await router.replace({ query: cleanQuery });
}

const connectedOptions = [
  { label: 'All', value: '' },
  { label: 'Connected', value: '1' },
  { label: 'Not connected', value: '0' },
];

const { filter, page, query, reset, activeCount } = useListFilters(['q', 'connected', 'tags', 'team']);

const connectedFilter = filter('connected');
const connected = computed<'' | '1' | '0'>({
  get: () => {
    const val = connectedFilter.value[0];
    return val === '1' || val === '0' ? val : '';
  },
  set: (val) => {
    connectedFilter.value = val === '1' ? ['1'] : val === '0' ? ['0'] : [];
  },
});

const tagsFilter = filter('tags');
const searchFilter = filter('q');

// A local ref so typing fetches nothing until Enter updates the URL.
const searchInput = ref(searchFilter.value[0] ?? '');

function applySearch(): void {
  searchFilter.value = searchInput.value ? [searchInput.value] : [];
}

// Sync the box when the term changes from outside (back/forward, "Clear filters").
watch(searchFilter, (value) => {
  searchInput.value = value[0] ?? '';
});

const tagSearchTerm = ref('');
const tagsQuery = computed(() => ({ q: tagSearchTerm.value || undefined }));
const { data: tagsData, error: tagsError, status: tagsStatus } = useFetch('/api/tags', {
  query: tagsQuery,
  retry: 0,
});
const tagOptions = computed(() => (tagsData.value?.items ?? []).map((tag) => ({ label: tag.name, value: tag.id })));

watch(tagsError, (error) => {
  if (error) {
    notifyApiError(error);
  }
});

const { data: sitesData, error: sitesError, status: sitesStatus, refresh: refreshSites } = useFetch('/api/sites', {
  key: 'sites-list',
  query,
  retry: 0,
});

const isLoadingSites = computed(() => sitesStatus.value === 'pending');
const sites = computed(() => sitesData.value?.items ?? []);
const total = computed(() => sitesData.value?.meta.total ?? 0);
const totalLabel = computed(() => (total.value === 1 ? '1 site' : `${total.value} sites`));

const tagsModalOpen = ref(false);
const tagsModalSite = ref<Site | null>(null);

function openTagsModal(site: Site): void {
  tagsModalSite.value = site;
  tagsModalOpen.value = true;
}

function onTagsSaved(): void {
  refreshSites();
}

const formOpen = ref(false);
const pluginModalOpen = ref(false);

interface SiteSavedResult {
  siteId: string;
  connectionRequired: boolean;
}

// A new site or URI needs connecting; any other edit only updates the row.
async function onSiteSaved(result: SiteSavedResult): Promise<void> {
  if (result.connectionRequired) {
    await navigateTo(`/sites/${result.siteId}?tab=connection`);
    return;
  }

  refreshSites();
}

const togglingFavoriteId = ref<string | null>(null);

// New objects so Nuxt's shallow data ref notifies consumers; spreading keeps the relationships
// the update response lacks.
async function toggleFavorite(site: Site): Promise<void> {
  if (site.is_favorite === undefined || togglingFavoriteId.value) {
    return;
  }

  togglingFavoriteId.value = site.id;

  try {
    const { favorite } = await $fetch<{ favorite: boolean }>(`/api/sites/${site.id}/favorite`, {
      method: 'PATCH',
      body: { favorite: !site.is_favorite },
    });

    if (sitesData.value) {
      sitesData.value = {
        ...sitesData.value,
        items: sitesData.value.items.map((candidate) =>
          candidate.id === site.id ? { ...candidate, is_favorite: favorite } : candidate),
      };
    }
  } catch (e) {
    notifyApiError(e);
  } finally {
    togglingFavoriteId.value = null;
  }
}

const columns: TableColumn<Site>[] = [
  { id: 'name', header: 'Site', meta: { class: { th: 'min-w-[260px]', td: 'min-w-[260px] max-w-[340px]' } } },
  { id: 'status', header: 'Connection', meta: { class: { th: 'w-[170px]', td: 'w-[170px]' } } },
  { id: 'team', header: 'Team', meta: { class: { th: 'w-[180px]', td: 'w-[180px] max-w-[180px]' } } },
  { id: 'tags', header: 'Tags' },
  { id: 'actions', header: '', meta: { class: { th: 'w-[130px]', td: 'w-[130px]' } } },
];
</script>

<template>
  <div class="flex min-h-full flex-col">
    <AppNavbar title="Sites">
      <template #trailing>
        <span v-if="sitesData" class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ totalLabel }}</span>
        <UButton
          to="/tags"
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-tag"
          aria-label="Tags"
          :ui="{ label: 'hidden sm:inline' }"
          label="Tags"
        />
        <UButton
          to="/teams"
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-users"
          aria-label="Teams"
          :ui="{ label: 'hidden sm:inline' }"
          label="Teams"
        />
      </template>

      <template #right>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-plug"
          label="Get connection plugin"
          @click="pluginModalOpen = true"
        />
        <UButton icon="i-lucide-plus" label="Add site" @click="formOpen = true" />
      </template>
    </AppNavbar>

    <UDashboardToolbar>
      <template #left>
        <UInput
          v-model="searchInput"
          icon="i-lucide-search"
          placeholder="Search sites"
          aria-label="Search sites"
          class="w-full sm:w-70"
          @keydown.enter="applySearch"
        />
        <USelectMenu
          v-model="connected"
          :items="connectedOptions"
          value-key="value"
          icon="i-lucide-activity"
          placeholder="Connection"
          aria-label="Filter by connection"
          class="w-full sm:w-52"
        />
        <USelectMenu
          v-model="tagsFilter"
          v-model:search-term="tagSearchTerm"
          :items="tagOptions"
          value-key="value"
          :multiple="true"
          ignore-filter
          :loading="tagsStatus === 'pending'"
          :disabled="!!tagsError"
          icon="i-lucide-tag"
          :placeholder="tagsError ? 'Tags unavailable' : 'Search or select tags'"
          aria-label="Filter by tags"
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

    <AppErrorState v-if="sitesError" :error="sitesError" size="lg" class="grow" :retry="refreshSites" />

    <template v-else>
      <div class="min-w-0 grow">
        <UTable
          :data="sites"
          :columns="columns"
          :loading="isLoadingSites"
          loading-color="primary"
          loading-animation="carousel"
          :ui="{ th: 'px-4 sm:px-6', td: 'px-4 sm:px-6' }"
        >
          <template #name-cell="{ row }">
            <NuxtLink :to="`/sites/${row.original.id}`" class="group flex min-w-0 flex-col leading-tight">
              <span class="truncate text-row font-medium text-highlighted transition-colors group-hover:text-primary">{{ row.original.name }}</span>
              <span class="truncate font-mono text-mono-sm text-muted">{{ row.original.display_host }}</span>
            </NuxtLink>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :color="connectionStatusTone(row.original.connection_status)"
              variant="soft"
              :label="connectionStatusLabel(row.original.connection_status)"
            />
          </template>

          <template #team-cell="{ row }">
            <span class="block truncate text-meta text-toned">{{ row.original.team?.name ?? '—' }}</span>
          </template>

          <template #tags-cell="{ row }">
            <div v-if="row.original.tags?.length" class="flex flex-wrap items-center gap-1.5">
              <TagBadge v-for="tag in row.original.tags" :key="tag.id" :tag="tag" />
            </div>
            <span v-else class="text-dimmed">—</span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center justify-end gap-1">
              <UButton
                icon="i-lucide-star"
                :color="row.original.is_favorite ? 'warning' : 'neutral'"
                :variant="row.original.is_favorite ? 'solid' : 'ghost'"
                size="sm"
                :aria-label="`Toggle favorite for ${row.original.name}`"
                :disabled="row.original.is_favorite === undefined"
                :loading="togglingFavoriteId === row.original.id"
                @click="toggleFavorite(row.original)"
              />
              <UButton
                label="Manage tags"
                icon="i-lucide-tag"
                color="neutral"
                variant="link"
                size="sm"
                @click="openTagsModal(row.original)"
              />
            </div>
          </template>

          <template #empty>
            <UEmpty
              v-if="activeCount > 0"
              icon="i-lucide-search-x"
              title="No sites match these filters"
              description="Try another term or remove one of the active filters."
              size="md"
            >
              <template #actions>
                <UButton color="neutral" variant="subtle" icon="i-lucide-x" label="Clear filters" @click="reset" />
              </template>
            </UEmpty>
            <UEmpty
              v-else
              icon="i-lucide-globe"
              title="No sites yet"
              description="No site has been connected to this account yet."
              size="lg"
            />
          </template>
        </UTable>
      </div>

      <AppPaginationFooter
        v-if="sitesData && total > 0"
        v-model:page="page"
        :total="total"
        :per-page="sitesData.meta.perPage"
        variant="page"
      />
    </template>

    <SiteTagsModal
      v-if="tagsModalSite"
      v-model:open="tagsModalOpen"
      :site="tagsModalSite"
      @saved="onTagsSaved"
    />

    <SiteFormModal v-model:open="formOpen" @saved="onSiteSaved" />
    <ConnectionPluginModal v-model:open="pluginModalOpen" />
  </div>
</template>
