<script setup lang="ts">
import type { NuxtError } from '#app';

interface SiteBrokenLinksResponse {
  items: SiteBrokenLinkIssue[];
  meta: Page<SiteBrokenLinkIssue>['meta'];
}

const props = defineProps<{
  site: Site;
}>();

const { data, error, status, refresh } = useFetch<SiteBrokenLinksResponse, NuxtError>(
  () => `/api/sites/${props.site.id}/broken-links`,
  { retry: 0 },
);

const issues = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const pending = computed(() => status.value === 'pending');
const notFound = computed(() => error.value?.statusCode === 404);

function severityTone(severity: BrokenLinkSeverity): 'error' | 'warning' | 'neutral' {
  if (severity === 'error') {
    return 'error';
  }

  if (severity === 'warning') {
    return 'warning';
  }

  return 'neutral';
}

function severityLabel(severity: BrokenLinkSeverity): string {
  if (severity === 'error') {
    return 'Error';
  }

  if (severity === 'warning') {
    return 'Warning';
  }

  return 'Info';
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Broken links</h2>
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

    <p v-else-if="issues.length === 0" class="text-meta text-dimmed">
      No issues found
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li v-for="issue in issues" :key="issue.id" class="flex items-center justify-between gap-3">
        <span class="min-w-0 truncate font-mono text-mono text-toned" :title="issue.target_url">{{ issue.target_url }}</span>
        <div class="flex shrink-0 items-center gap-2">
          <span class="font-mono text-mono text-muted">{{ issue.http_status_code ?? '—' }}</span>
          <UBadge :color="severityTone(issue.severity)" variant="soft" size="sm" :label="severityLabel(issue.severity)" />
        </div>
      </li>
    </ul>
  </UCard>
</template>
