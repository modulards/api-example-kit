<script setup lang="ts">
defineProps<{
  tag: Pick<Tag, 'name' | 'color'>;
}>();
</script>

<template>
  <UBadge
    color="neutral"
    variant="subtle"
    :label="tag.name"
    :title="tag.name"
    :aria-label="tag.name"
    class="max-w-40 min-w-0"
    :ui="{ label: 'truncate' }"
  >
    <template #leading>
      <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: tag.color }" />
    </template>
  </UBadge>
</template>
