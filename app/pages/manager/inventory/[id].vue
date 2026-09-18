<script setup lang="ts">
import type { NuxtError } from '#app';
import type { BreadcrumbItem } from '@nuxt/ui';
import type { SiteItem } from '#shared/types/modular';
import { sentenceCase } from '#shared/utils/text';

interface SiteItemDetailResponse {
  item: SiteItem;
}

interface DetailRow {
  label: string;
  value: string;
  mono?: boolean;
}

const route = useRoute();

const id = computed(() => {
  const raw = route.params.id;
  return Array.isArray(raw) ? (raw[0] ?? '') : raw;
});

const { data, error, status, refresh } = useFetch<SiteItemDetailResponse, NuxtError>(
  () => `/api/site-items/${id.value}`,
  { retry: 0 },
);

const item = computed(() => data.value?.item);
const pending = computed(() => status.value === 'pending');

const errorInfo = computed(() => {
  const err = error.value;

  if (!err) {
    return null;
  }

  return { isNotFound: (err.statusCode ?? 500) === 404 };
});

const heading = computed(() => item.value?.name ?? item.value?.basename ?? 'Site item');

useHead(() => ({
  title: heading.value,
}));

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const current = item.value;
  const componentId = current?.component_id;
  const component = componentId === null || componentId === undefined
    ? { label: 'Installations', to: '/manager/inventory' }
    : {
        label: current?.name ?? current?.basename ?? 'Component',
        to: { path: '/manager/inventory', query: { component: String(componentId) } },
      };

  return [
    { label: 'Manager', to: '/manager' },
    component,
    { label: current?.site?.name ?? 'Installation' },
  ];
});

const detailRows = computed<DetailRow[]>(() => {
  const current = item.value;

  if (!current) {
    return [];
  }

  const rows: DetailRow[] = [
    { label: 'Name', value: current.name ?? '—' },
    { label: 'Basename', value: current.basename, mono: true },
    { label: 'Slug', value: current.slug ?? '—', mono: true },
    { label: 'Type', value: siteItemTypeLabel(current.type) },
    { label: 'Version', value: current.version ?? '—', mono: true },
    { label: 'Previous version', value: current.previous_version ?? '—', mono: true },
    { label: 'Available update', value: current.new_version ?? '—', mono: true },
    { label: 'Hidden', value: current.is_hidden ? 'Yes' : 'No' },
    { label: 'Has error', value: current.has_error ? 'Yes' : 'No' },
  ];

  if (current.copilot_score != null) {
    rows.push({ label: 'Copilot score', value: String(current.copilot_score) });
  }

  if (current.released_at) {
    rows.push({ label: 'Released', value: formatShortDate(current.released_at) });
  }

  if (current.days_since_release != null) {
    rows.push({ label: 'Release age', value: releaseAgeLabel(current.days_since_release) });
  }

  rows.push(
    { label: 'Created', value: formatDateTime(current.created_at) },
    { label: 'Last updated', value: formatDateTime(current.updated_at) },
  );

  return rows;
});

function releaseAgeLabel(days: number): string {
  if (days === 0) {
    return 'Today';
  }

  return days === 1 ? '1 day' : `${days} days`;
}

function inProgressLabel(type: string | null | undefined, status: string | null | undefined): string {
  const action = type
    ? sentenceCase((type.split('.').at(-1) ?? type).replaceAll('_', ' '))
    : 'Action';

  return status ? `${action}: ${sentenceCase(status.replaceAll('_', ' '))}` : action;
}

const inProgress = computed(() => {
  const current = item.value;

  if (!current) {
    return null;
  }

  const present = current.in_progress_action_id != null
    || current.in_progress_action_type != null
    || current.in_progress_action_status != null;

  if (!present) {
    return null;
  }

  return {
    label: inProgressLabel(current.in_progress_action_type, current.in_progress_action_status),
    actionId: current.in_progress_action_id == null ? null : String(current.in_progress_action_id),
  };
});

const historyTo = computed(() => {
  const current = item.value;

  if (!current?.site) {
    return null;
  }

  return {
    path: '/manager/history',
    query: { site: current.site.id, siteName: current.site.name },
  };
});
</script>

<template>
  <div>
    <AppNavbar>
      <template #left>
        <UBreadcrumb :items="breadcrumbItems" :ui="{ link: 'text-row', separatorIcon: 'size-3.5' }" />
      </template>
    </AppNavbar>

    <div class="px-4 py-6 sm:px-6">
      <div v-if="pending && !item" class="flex flex-col gap-5">
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

      <template v-else-if="errorInfo && !item">
        <UEmpty
          v-if="errorInfo.isNotFound"
          icon="i-lucide-search-x"
          title="This installation doesn't exist or isn't in your account"
          description="It may have been uninstalled, or the link may be wrong."
          size="lg"
        >
          <template #actions>
            <UButton label="Back to Manager" icon="i-lucide-arrow-left" to="/manager" color="neutral" variant="subtle" />
          </template>
        </UEmpty>

        <AppErrorState v-else :error="error" size="lg" :retry="refresh">
          <template #actions>
            <UButton label="Back to Manager" icon="i-lucide-arrow-left" to="/manager" color="neutral" variant="ghost" />
          </template>
        </AppErrorState>
      </template>

      <div v-else-if="item" class="flex flex-col gap-5">
        <div class="flex flex-wrap items-start gap-4">
          <UAvatar
            :alt="heading"
            size="xl"
            :ui="{ root: 'rounded-panel ring ring-default', fallback: 'uppercase' }"
          />

          <div class="flex min-w-0 grow flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="min-w-0 truncate text-page-title font-semibold text-highlighted">
                {{ heading }}
              </h1>
              <UBadge :color="siteItemStatusTone(item.status)" variant="soft" :label="siteItemStatusLabel(item.status)" />
              <!-- `vulnerabilities_c_exists` covers critical and high: https://api.docs.modulards.com/modular-ds-public-api/site-items/show-site-item -->
              <UBadge v-if="item.vulnerabilities_c_exists" color="error" variant="subtle" label="Severe vulnerability" />
              <UBadge v-else-if="item.vulnerabilities_exists" color="warning" variant="subtle" label="Vulnerability" />
              <UBadge v-if="pending" color="neutral" variant="subtle" label="Updating…" />
            </div>

            <h2 class="flex min-w-0 flex-wrap items-center gap-2.5 text-meta font-normal text-muted">
              <NuxtLink
                v-if="item.site"
                :to="`/sites/${item.site.id}`"
                class="min-w-0 truncate font-medium transition-colors hover:text-primary"
              >
                {{ item.site.name }}
              </NuxtLink>
              <span v-if="item.site" class="size-[3px] shrink-0 rounded-full bg-inverted/30" />
              <span class="truncate">{{ siteItemTypeLabel(item.type) }}</span>
            </h2>

            <div v-if="inProgress" class="flex flex-wrap items-center gap-2">
              <UBadge color="warning" variant="subtle" icon="i-lucide-loader-circle" :label="inProgress.label" />
              <NuxtLink
                v-if="inProgress.actionId"
                :to="`/manager/actions/${inProgress.actionId}`"
                class="text-meta font-medium text-muted transition-colors hover:text-primary"
              >
                View action
              </NuxtLink>
            </div>
          </div>

          <UButton
            v-if="historyTo"
            :to="historyTo"
            icon="i-lucide-history"
            label="Update history"
            color="neutral"
            variant="outline"
          />
        </div>

        <div class="grid gap-4" :class="{ 'lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]': item.last_error }">
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
                  class="w-full min-w-0 break-words sm:w-auto sm:flex-1 sm:truncate"
                  :class="row.mono ? 'font-mono text-mono' : 'text-meta'"
                  :title="row.value"
                >
                  {{ row.value }}
                </dd>
              </div>
            </dl>
          </UCard>

          <UCard v-if="item.last_error">
            <template #header>
              <h2 class="min-w-0 truncate text-row font-semibold text-error">Last error</h2>
            </template>

            <p class="font-mono text-mono text-error">{{ item.last_error.code }}</p>
            <p class="mt-1.5 text-meta text-toned">{{ item.last_error.message }}</p>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
