<script setup lang="ts">
import type { AsyncDataRequestStatus } from '#app';
import type { RouteLocationRaw } from 'vue-router';

type StatTone = 'neutral' | 'success' | 'warning' | 'error';

const props = defineProps<{
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: StatTone;
  /** From 0 to 1. */
  ratio?: number;
  /** Disabled on error so the card link cannot swallow the Retry click. */
  to?: RouteLocationRaw;
  status: AsyncDataRequestStatus;
  error?: unknown;
  retry?: () => unknown;
}>();

const VALUE_CLASS: Record<StatTone, string> = {
  neutral: 'text-highlighted',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

const tone = computed<StatTone>(() => props.tone ?? 'neutral');
const isLink = computed(() => Boolean(props.to) && !props.error);
const percent = computed(() => Math.round(Math.min(Math.max(props.ratio ?? 0, 0), 1) * 100));
</script>

<template>
  <UPageCard
    :to="isLink ? to : undefined"
    :ui="{ container: 'p-4 sm:p-4', wrapper: 'w-full', body: 'flex w-full min-w-0 flex-col' }"
  >
    <template #body>
      <span class="truncate text-eyebrow font-medium uppercase text-muted">{{ label }}</span>

      <template v-if="error">
        <p class="mt-2 text-meta text-error">
          Couldn't load.
        </p>
        <UButton
          color="neutral"
          variant="subtle"
          size="xs"
          icon="i-lucide-refresh-cw"
          label="Retry"
          class="mt-2 self-start"
          :loading-auto="true"
          @click="() => props.retry?.()"
        />
      </template>

      <template v-else-if="status === 'pending'">
        <USkeleton class="mt-2 h-7 w-16" />
        <USkeleton v-if="ratio !== undefined || hint" class="mt-3 h-3 w-28" />
      </template>

      <template v-else>
        <div class="mt-2 flex min-w-0 items-baseline gap-1.5">
          <span class="truncate text-display font-semibold" :class="VALUE_CLASS[tone]">{{ value }}</span>
          <span v-if="unit" class="truncate text-meta text-muted">{{ unit }}</span>
        </div>

        <UProgress
          v-if="ratio !== undefined"
          :model-value="percent"
          :color="tone === 'neutral' ? 'primary' : tone"
          size="xs"
          class="mt-3"
        />

        <p v-if="hint" class="mt-3 truncate text-meta text-muted">
          {{ hint }}
        </p>
      </template>
    </template>
  </UPageCard>
</template>
