<script setup lang="ts">
interface DetailRow {
  label: string;
  value: string;
  mono?: boolean;
}

const props = defineProps<{
  site: Site;
}>();

const emit = defineEmits<{
  refreshRequested: [];
}>();

function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function combineNameVersion(name: string | null, version: string | null): string {
  if (!name) {
    return '—';
  }

  return version ? `${name} ${version}` : name;
}

const platformCells = computed(() => {
  const s = props.site;

  return [
    { label: 'Core version', value: s.core_version ?? '—', mono: true },
    { label: s.engine ?? 'Engine', value: s.engine_version ?? '—', mono: true },
    { label: s.db_engine ?? 'Database', value: s.db_engine_version ?? '—', mono: true },
    { label: 'Connector', value: s.connector_version ?? '—', mono: true },
  ];
});

const detailRows = computed<DetailRow[]>(() => {
  const s = props.site;

  return [
    { label: 'Provider', value: s.provider || '—' },
    { label: 'Multisite', value: formatBoolean(s.is_multisite) },
    { label: 'Ecommerce', value: combineNameVersion(s.ecommerce_engine, s.ecommerce_version) },
    { label: 'Created', value: formatDateTime(s.created_at) },
    { label: 'Last updated', value: formatDateTime(s.updated_at) },
  ];
});

const tagsModalOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div class="flex min-w-0 flex-col gap-4">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Platform</h2>
          </template>

          <div class="-mb-px -me-px grid grid-cols-2 sm:grid-cols-3">
            <div
              v-for="cell in platformCells"
              :key="cell.label"
              class="min-w-0 border-b border-e border-default px-4 py-3.5"
            >
              <div class="truncate text-eyebrow font-medium uppercase text-muted">
                {{ cell.label }}
              </div>
              <div
                class="mt-1.5 truncate text-row"
                :class="cell.mono ? 'font-mono text-highlighted' : 'text-toned'"
              >
                {{ cell.value }}
              </div>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Details</h2>
          </template>

          <dl class="px-5">
            <div
              v-for="row in detailRows"
              :key="row.label"
              class="flex flex-col items-start gap-1 border-b border-muted py-2.5 last:border-0 sm:flex-row sm:items-center sm:gap-4"
            >
              <dt class="text-meta text-muted sm:w-48 sm:shrink-0">
                {{ row.label }}
              </dt>
              <dd
                class="w-full min-w-0 break-all sm:w-auto sm:truncate"
                :class="row.mono ? 'font-mono text-mono' : 'text-meta'"
              >
                {{ row.value }}
              </dd>
            </div>
          </dl>
        </UCard>
      </div>

      <div class="flex min-w-0 flex-col gap-4">
        <UCard>
          <template #header>
            <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Organization</h2>
            <div class="grow" />
            <UButton
              label="Manage tags"
              color="neutral"
              variant="link"
              size="xs"
              class="px-0"
              @click="tagsModalOpen = true"
            />
          </template>

          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <span class="text-meta text-muted">Tags</span>
              <div v-if="site.tags?.length" class="flex flex-wrap gap-1.5">
                <TagBadge v-for="tag in site.tags" :key="tag.id" :tag="tag" />
              </div>
              <p v-else class="text-meta text-dimmed">No tags</p>
            </div>

            <USeparator />

            <div class="flex flex-col gap-2">
              <span class="text-meta text-muted">Team</span>
              <div v-if="site.team" class="flex items-center gap-2.5">
                <UAvatar :alt="site.team.name" size="sm" :ui="{ root: 'rounded-control', fallback: 'uppercase' }" />
                <span class="min-w-0 break-words text-meta font-medium text-highlighted sm:truncate">{{ site.team.name }}</span>
              </div>
              <p v-else class="text-meta text-dimmed">No team assigned</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SiteCertificateCard :site="site" />
      <SiteHealthCard :site="site" />
      <SiteBackupsCard :site="site" />
      <SiteBrokenLinksCard :site="site" />
      <SiteMalwareScansCard :site="site" />
    </div>
  </div>

  <SiteTagsModal
    v-model:open="tagsModalOpen"
    :site="site"
    @saved="emit('refreshRequested')"
  />
</template>
