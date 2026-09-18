<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const slots = useSlots();
const forwardedSlotNames = Object.keys(slots).filter((name) => name !== 'right');
</script>

<template>
  <UDashboardNavbar v-bind="$attrs">
    <template v-for="name in forwardedSlotNames" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>

    <template #right>
      <slot name="right" />
      <PendingActionsMenu />
    </template>
  </UDashboardNavbar>
</template>
