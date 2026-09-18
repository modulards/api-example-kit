<script setup lang="ts">
import type { NuxtError } from '#app';
import { sentenceCase } from '#shared/utils/text';

interface SiteBackupsResponse {
  items: SiteBackup[];
  meta: Page<SiteBackup>['meta'];
}

const props = defineProps<{
  site: Site;
}>();

const { data, error, status, refresh } = useFetch<SiteBackupsResponse, NuxtError>(
  () => `/api/sites/${props.site.id}/backups`,
  { retry: 0 },
);

const backups = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const pending = computed(() => status.value === 'pending');
const notFound = computed(() => error.value?.statusCode === 404);

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 ** 3) {
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function backupStatusTone(backupStatus: string): 'success' | 'error' | 'neutral' {
  if (backupStatus === 'completed') {
    return 'success';
  }

  if (backupStatus.startsWith('failed')) {
    return 'error';
  }

  return 'neutral';
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Backups</h2>
      <div class="grow" />
      <span v-if="data" class="text-meta text-muted">{{ total }} total</span>
    </template>

    <div v-if="pending" class="flex flex-col gap-2">
      <USkeleton v-for="n in 3" :key="n" class="h-5 w-full" />
    </div>

    <p v-else-if="notFound" class="text-meta text-dimmed">
      Not available for this site
    </p>

    <AppErrorState v-else-if="error" :error="error" :retry="refresh" />

    <p v-else-if="backups.length === 0" class="text-meta text-dimmed">
      No backups yet
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li v-for="backup in backups" :key="backup.id" class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 flex-col leading-tight">
          <span class="truncate text-meta text-toned">{{ formatDateTime(backup.created_at) }}</span>
          <span class="truncate text-meta text-muted">{{ backup.backup_type }} · {{ formatSize(backup.size) }}</span>
        </div>
        <UBadge :color="backupStatusTone(backup.status)" variant="soft" size="sm" :label="sentenceCase(backup.status)" />
      </li>
    </ul>
  </UCard>
</template>
