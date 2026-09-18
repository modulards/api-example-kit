<script setup lang="ts">
const props = defineProps<{
  result: ManagerDispatchResult | null;
  componentName?: string;
  error?: unknown;
  siteContext?: Site | null;
}>();

function skippedSiteName(skipped: SkippedSite): string {
  return skipped.site_name ?? 'Site';
}

const acceptedCount = computed(() => props.result?.actions.length ?? 0);
const skippedCount = computed(() => props.result?.skipped.length ?? 0);
</script>

<template>
  <UCard v-if="error || (result && skippedCount > 0)">
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Action request</h2>
      <div class="grow" />
      <span v-if="componentName" class="truncate text-meta text-dimmed">{{ componentName }}</span>
      <span v-else-if="siteContext" class="truncate text-meta text-dimmed">{{ siteContext.name }}</span>
    </template>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Action request failed"
      :description="apiErrorDetail(error) ?? 'The action was not requested.'"
    />

    <template v-else-if="result">
      <UAlert
        v-if="acceptedCount === 0"
        color="warning"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="No action requests accepted"
        description="The API skipped every selected site. Review the reasons below."
      />
      <UAlert
        v-else
        color="info"
        variant="subtle"
        icon="i-lucide-send"
        :title="`${acceptedCount} action ${acceptedCount === 1 ? 'request' : 'requests'} accepted`"
        :description="`${skippedCount} selected ${skippedCount === 1 ? 'site was' : 'sites were'} skipped. Accepted requests are tracked in Actions.`"
      />

      <div v-if="skippedCount > 0" class="mt-4 flex flex-col gap-1.5">
        <h3 class="text-meta font-medium text-toned">Skipped sites</h3>
        <ul class="flex flex-col gap-2">
          <li
            v-for="(skipped, index) in result.skipped"
            :key="`${skipped.site_id}-${index}`"
            class="flex min-w-0 flex-col gap-0.5 leading-tight"
          >
            <div class="flex items-center justify-between gap-3">
              <NuxtLink
                :to="`/sites/${skipped.site_id}`"
                class="truncate text-meta font-medium text-toned transition-colors hover:text-primary"
              >
                {{ skippedSiteName(skipped) }}
              </NuxtLink>
              <span class="shrink-0 font-mono text-mono-sm text-dimmed">{{ skipped.reason_code }}</span>
            </div>
            <p class="text-meta text-muted">{{ skipped.message }}</p>
          </li>
        </ul>
      </div>
    </template>
  </UCard>
</template>
