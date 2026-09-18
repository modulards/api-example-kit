<script setup lang="ts">
import { en } from '@nuxt/ui/locale';

useHead({
  htmlAttrs: { lang: 'en' },
  title: 'Modular DS API Example Kit',
  titleTemplate: (title?: string) => (title && title !== 'Modular DS API Example Kit' ? `${title} · Modular DS API Example Kit` : 'Modular DS API Example Kit'),
});
</script>

<template>
  <UApp :locale="en">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
