<script setup lang="ts">
const props = withDefaults(defineProps<{
  total: number;
  perPage: number;
  /** `card` stays flush because `UCard` already pads its footer. */
  variant?: 'card' | 'page';
}>(), {
  variant: 'card',
});

const page = defineModel<number>('page', { required: true });

const rangeLabel = computed(() => {
  const start = (page.value - 1) * props.perPage + 1;
  const end = Math.min(page.value * props.perPage, props.total);
  return `Showing ${start}–${end} of ${props.total}`;
});
</script>

<template>
  <div
    class="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
    :class="variant === 'page' ? 'border-t border-default px-4 py-4 sm:px-6' : ''"
  >
    <span class="min-w-0 text-meta text-dimmed">{{ rangeLabel }}</span>
    <UPagination
      v-model:page="page"
      :total="total"
      :items-per-page="perPage"
      class="sm:ml-auto"
    />
  </div>
</template>
