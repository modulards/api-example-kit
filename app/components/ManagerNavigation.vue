<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const route = useRoute();

function contextQuery(keys: readonly string[]): Record<string, string | string[]> {
  return Object.fromEntries(keys.flatMap((key) => {
    const value = route.query[key];
    return typeof value === 'string' || (Array.isArray(value) && value.every((item) => typeof item === 'string'))
      ? [[key, value as string | string[]]]
      : [];
  }));
}

const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Manager', to: '/manager', icon: 'i-lucide-puzzle' },
  { label: 'Activity', to: { path: '/manager/actions', query: contextQuery(['site', 'component']) }, icon: 'i-lucide-list-checks' },
  { label: 'Version history', to: { path: '/manager/history', query: contextQuery(['site']) }, icon: 'i-lucide-history' },
]);
</script>

<template>
  <UNavigationMenu :items="items" orientation="horizontal" class="min-w-0 overflow-x-auto" />
</template>
