<script setup lang="ts">
interface CacheClearResponse {
  result: CacheClearResult;
}

const props = defineProps<{
  site: Site;
}>();

const toast = useToast();

const modalOpen = shallowRef(false);
const clearing = shallowRef(false);
const result = shallowRef<CacheClearResult | null>(null);

async function clearCache(): Promise<void> {
  clearing.value = true;

  try {
    const response = await $fetch<CacheClearResponse>(`/api/sites/${props.site.id}/cache-clear`, { method: 'POST' });
    result.value = response.result;
    modalOpen.value = false;
    toast.add({
      title: 'Cache clear requested',
      description: `Status: ${response.result.status}. This is not confirmation that the cache was cleared.`,
      color: 'success',
    });
  } catch (e) {
    notifyApiError(e);
  } finally {
    clearing.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Cache</h2>
    </template>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="max-w-prose text-meta text-muted">
        Ask the site to clear its cache.
      </p>

      <UButton
        label="Clear cache"
        color="neutral"
        variant="outline"
        icon="i-lucide-eraser"
        @click="modalOpen = true"
      />
    </div>
    <div v-if="result" class="mt-4 flex flex-col gap-1.5 text-meta">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-muted">Last request: requested</span>
        <UBadge color="neutral" variant="soft" :label="`Status: ${result.status}`" />
      </div>
      <p class="text-muted">
        The API accepted the request; it does not confirm completion.
      </p>
    </div>

    <UModal
      v-model:open="modalOpen"
      title="Clear the cache"
      :ui="{ content: 'max-w-[420px]' }"
    >
      <template #body>
        <div class="flex flex-col gap-2">
          <p class="text-row text-toned">
            Send a cache-clear request to
            <span class="font-medium text-highlighted">{{ site.name }}</span>?
          </p>
          <p class="text-meta text-muted">
            It may take a moment to apply.
          </p>
        </div>
      </template>

      <template #footer>
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="clearing"
          @click="modalOpen = false"
        />
        <UButton
          label="Clear cache"
          :loading="clearing"
          @click="clearCache"
        />
      </template>
    </UModal>
  </UCard>
</template>
