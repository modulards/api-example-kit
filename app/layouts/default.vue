<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const links: NavigationMenuItem[] = [
  { label: 'Sites', to: '/sites', icon: 'i-lucide-globe' },
  { label: 'Manager', to: '/manager', icon: 'i-lucide-puzzle' },
  { label: 'Uptime', to: '/uptime', icon: 'i-lucide-activity' },
  { label: 'Vulnerabilities', to: '/vulnerabilities', icon: 'i-lucide-shield-alert' },
];

const { data: meta } = await useFetch('/api/meta', { key: 'app-meta', retry: 0 });

usePendingActionPolling();

const keyChipLabel = computed(() => (meta.value?.hasKey ? 'API key saved' : 'No API key'));
</script>

<template>
  <UDashboardGroup>
    <a
      href="#content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-control focus:bg-elevated focus:px-3 focus:py-2 focus:text-row focus:text-highlighted focus:ring focus:ring-primary"
    >
      Skip to content
    </a>

    <UDashboardSidebar :ui="{ root: 'lg:w-60' }">
      <template #header>
        <AppBrand />
      </template>

      <UNavigationMenu
        :items="links"
        orientation="vertical"
        :ui="{ list: 'flex flex-col gap-1.5', link: 'h-10 px-3 gap-3', linkLeadingIcon: 'size-5' }"
      />

      <template #footer>
        <div class="flex w-full min-w-0 flex-col gap-2.5">
          <UButton
            to="/settings"
            color="neutral"
            variant="ghost"
            icon="i-lucide-key-round"
            trailing-icon="i-lucide-settings"
            :aria-label="`Settings: ${keyChipLabel}`"
            class="w-full justify-start"
            :ui="{ leadingIcon: 'text-dimmed', trailingIcon: 'text-dimmed' }"
          >
            <span class="min-w-0 grow truncate text-eyebrow font-medium text-dimmed">
              {{ keyChipLabel }}
            </span>
          </UButton>
          <UButton
            href="https://api.docs.modulards.com/"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="ghost"
            icon="i-lucide-book-open"
            aria-label="API documentation"
            class="w-full justify-start"
            :ui="{ leadingIcon: 'text-dimmed' }"
          >
            <span class="text-eyebrow font-medium text-dimmed">API documentation</span>
          </UButton>

          <div class="flex w-full items-center justify-end">
            <UColorModeButton size="sm" square />
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #body>
        <main id="content" class="flex min-h-full flex-col">
          <slot />
        </main>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
