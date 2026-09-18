<script setup lang="ts">
const props = defineProps<{
  error: unknown;
  size?: 'md' | 'lg';
  /** A prop, not an emit, so `loading-auto` gets the promise and shows a busy state. */
  retry?: () => unknown;
}>();

const slots = defineSlots<{
  actions?: () => unknown;
}>();

const title = computed(() => apiErrorTitle(props.error));
const detail = computed(() => apiErrorDetail(props.error));
</script>

<template>
  <!-- Retry lives in the slot because UEmpty renders `actions` instead of the slot, not beside it. -->
  <UEmpty
    :avatar="{ icon: 'i-lucide-triangle-alert', color: 'error' }"
    :title="title"
    :description="detail"
    :size="size"
  >
    <template v-if="props.retry || slots.actions" #actions>
      <UButton
        v-if="props.retry"
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        label="Retry"
        :loading-auto="true"
        @click="() => props.retry?.()"
      />
      <slot name="actions" />
    </template>
  </UEmpty>
</template>
