<script setup lang="ts">
import type { SiteItemsSummary } from '#shared/types/modular';

const props = defineProps<{
  summary: SiteItemsSummary | null;
  loading?: boolean;
  siteName?: string;
}>();

const categories = computed(() => {
  if (!props.summary) {
    return [];
  }

  return [
    { label: 'Plugin', value: props.summary.plugin },
    { label: 'Theme', value: props.summary.theme },
    { label: 'Core', value: props.summary.core },
  ] as const;
});

function updatesLine(count: number): string {
  if (count === 1) {
    return '1 update available';
  }

  return `${count} updates available`;
}

function vulnerabilitiesLine(count: number): string {
  if (count === 1) {
    return '1 with vulnerabilities';
  }

  return `${count} with vulnerabilities`;
}
</script>

<template>
  <UCard v-if="summary" :ui="{ body: 'p-5 sm:p-5' }">
    <div class="flex items-baseline justify-between gap-2">
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Inventory summary</h2>
      <span v-if="siteName" class="shrink-0 text-meta text-muted">for {{ siteName }}</span>
    </div>

    <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-for="category in categories" :key="category.label" class="flex flex-col gap-1">
        <span class="text-eyebrow text-dimmed">{{ category.label }}</span>
        <span class="font-mono text-mono text-highlighted">{{ category.value.total }} total</span>
        <span
          class="text-meta"
          :class="category.value.updatable > 0 ? 'text-warning' : 'text-toned'"
        >{{ updatesLine(category.value.updatable) }}</span>
        <span
          class="text-meta"
          :class="category.value.has_vulnerabilities > 0 ? 'text-error' : 'text-toned'"
        >{{ vulnerabilitiesLine(category.value.has_vulnerabilities) }}</span>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-default pt-3">
      <span class="text-meta text-toned">
        <span class="font-mono text-mono text-highlighted">{{ summary.sites.total }}</span> sites
      </span>
      <span
        class="text-meta"
        :class="summary.sites.with_updates > 0 ? 'text-warning' : 'text-toned'"
      >{{ summary.sites.with_updates }} with updates</span>
    </div>

    <!-- Counts connected sites only: https://api.docs.modulards.com/modular-ds-public-api/site-items/summary -->
    <p class="mt-2 text-meta text-dimmed">
      Connected sites only — the list may include sites you cannot manage.
    </p>
  </UCard>

  <UCard v-else-if="loading" :ui="{ body: 'p-5 sm:p-5' }">
    <div class="flex flex-col gap-3">
      <USkeleton class="h-5 w-40" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="index in 3" :key="index" class="flex flex-col gap-2">
          <USkeleton class="h-3 w-12" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-28" />
        </div>
      </div>
      <USkeleton class="h-4 w-full" />
    </div>
  </UCard>
</template>
