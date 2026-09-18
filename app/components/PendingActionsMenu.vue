<script setup lang="ts">
import type { SiteAction, SiteActionStatus } from '#shared/types/modular';
import { sentenceCase } from '#shared/utils/text';

type StatusTone = 'neutral' | 'info' | 'error' | 'success' | 'warning';

const STATUS_TONE: Record<SiteActionStatus, StatusTone> = {
  pending: 'neutral',
  in_progress: 'info',
  failed: 'error',
  done: 'success',
  requires_action: 'warning',
};

const STATUS_ORDER: Record<SiteActionStatus, number> = {
  failed: 0,
  requires_action: 1,
  in_progress: 2,
  pending: 3,
  done: 4,
};

const {
  actions,
  presentation,
  markReviewed,
  clearExpiredCompletions,
} = usePendingActions();
const { error, refreshing, requestRefresh } = usePendingActionStatus();
const isOpen = shallowRef(false);
const now = shallowRef(Date.now());
const heldActionIds = shallowRef<string[]>([]);
let completionTimer: ReturnType<typeof setTimeout> | undefined;

function isRelevant(action: SiteAction, timestamp: number): boolean {
  if (action.status === 'pending' || action.status === 'in_progress') {
    return true;
  }

  if (action.status === 'failed' || action.status === 'requires_action') {
    return presentation.value[action.id]?.reviewedStatus !== action.status;
  }

  return (presentation.value[action.id]?.completedUntil ?? 0) > timestamp;
}

const relevantActions = computed(() => actions.value.filter((action) => isRelevant(action, now.value)));

const visibleActions = computed(() => {
  const heldIds = new Set(heldActionIds.value);

  return actions.value
    .filter((action) => isRelevant(action, now.value) || (isOpen.value && heldIds.has(action.id)))
    .sort((left, right) => {
      const statusDifference = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return Date.parse(right.updated_at ?? right.created_at ?? '')
        - Date.parse(left.updated_at ?? left.created_at ?? '');
    });
});

const indicatorActions = computed(() => isOpen.value ? visibleActions.value : relevantActions.value);
const failedCount = computed(() => indicatorActions.value.filter((action) => action.status === 'failed').length);
const approvalCount = computed(() =>
  indicatorActions.value.filter((action) => action.status === 'requires_action').length);
const activeCount = computed(() =>
  indicatorActions.value.filter((action) => action.status === 'pending' || action.status === 'in_progress').length);
const completedCount = computed(() => indicatorActions.value.filter((action) => action.status === 'done').length);
const attentionCount = computed(() => failedCount.value + approvalCount.value);
const shouldShow = computed(() => Boolean(error.value) || relevantActions.value.length > 0 || isOpen.value);

const triggerTone = computed<StatusTone>(() => {
  if (error.value || failedCount.value > 0) {
    return 'error';
  }

  if (approvalCount.value > 0) {
    return 'warning';
  }

  if (activeCount.value > 0) {
    return 'info';
  }

  return 'success';
});

const triggerIcon = computed(() => {
  if (error.value || failedCount.value > 0) {
    return 'i-lucide-circle-alert';
  }

  if (approvalCount.value > 0) {
    return 'i-lucide-triangle-alert';
  }

  if (activeCount.value > 0) {
    return 'i-lucide-loader-circle';
  }

  return 'i-lucide-circle-check';
});

const triggerCount = computed(() => {
  if (attentionCount.value > 0) {
    return attentionCount.value;
  }

  if (activeCount.value > 0) {
    return activeCount.value;
  }

  return completedCount.value;
});

const triggerLabel = computed(() => {
  if (error.value) {
    return 'Updates paused';
  }

  if (attentionCount.value > 0) {
    return `${triggerCount.value} ${triggerCount.value === 1 ? 'needs' : 'need'} attention`;
  }

  if (activeCount.value > 0) {
    return `${triggerCount.value} in progress`;
  }

  return `${triggerCount.value} completed`;
});

const triggerAriaLabel = computed(() => `${triggerLabel.value}. Open action updates.`);

function statusTone(status: SiteActionStatus): StatusTone {
  return STATUS_TONE[status];
}

function statusLabel(status: SiteActionStatus): string {
  return sentenceCase(status.replaceAll('_', ' '));
}

function actionTypeLabel(action: SiteAction): string {
  return sentenceCase(action.type.replaceAll(/[._]/g, ' '));
}

function siteName(action: SiteAction): string {
  return action.site?.name ?? 'Site unavailable';
}

function stopCompletionTimer(): void {
  if (completionTimer) {
    clearTimeout(completionTimer);
    completionTimer = undefined;
  }
}

function scheduleCompletionExpiry(): void {
  if (!import.meta.client) {
    return;
  }

  stopCompletionTimer();
  const currentTime = Date.now();
  const nextDeadline = actions.value.reduce<number | undefined>((soonest, action) => {
    const deadline = presentation.value[action.id]?.completedUntil;

    if (deadline === undefined || deadline <= currentTime) {
      return soonest;
    }

    return soonest === undefined ? deadline : Math.min(soonest, deadline);
  }, undefined);

  if (nextDeadline === undefined) {
    return;
  }

  completionTimer = setTimeout(() => {
    completionTimer = undefined;
    now.value = Date.now();

    if (!isOpen.value) {
      clearExpiredCompletions(now.value);
    }

    scheduleCompletionExpiry();
  }, nextDeadline - currentTime);
}

function closePopover(): void {
  isOpen.value = false;
}

function reviewAction(action: SiteAction): void {
  markReviewed(action);
  closePopover();
}

watch(relevantActions, (currentActions) => {
  if (!isOpen.value) {
    return;
  }

  heldActionIds.value = [...new Set([
    ...heldActionIds.value,
    ...currentActions.map((action) => action.id),
  ])];
});

watch(isOpen, (open) => {
  if (open) {
    heldActionIds.value = relevantActions.value.map((action) => action.id);
    return;
  }

  heldActionIds.value = [];
  now.value = Date.now();
  clearExpiredCompletions(now.value);
  scheduleCompletionExpiry();
});

watch([actions, presentation], scheduleCompletionExpiry, { immediate: true });

onMounted(() => {
  now.value = Date.now();
  clearExpiredCompletions(now.value);
  scheduleCompletionExpiry();
});

onUnmounted(stopCompletionTimer);
</script>

<template>
  <UPopover
    v-if="shouldShow"
    v-model:open="isOpen"
    :content="{ align: 'end', side: 'bottom', sideOffset: 8, collisionPadding: 8 }"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-sm' }"
  >
    <UButton
      :color="triggerTone"
      variant="soft"
      size="sm"
      :icon="triggerIcon"
      :aria-label="triggerAriaLabel"
      class="max-w-40"
    >
      <span v-if="!error" class="tabular-nums sm:hidden">{{ triggerCount }}</span>
      <span class="hidden truncate sm:inline">{{ triggerLabel }}</span>
    </UButton>

    <template #content>
      <div class="flex max-h-[min(32rem,calc(100vh-5rem))] flex-col">
        <div class="flex items-center gap-3 border-b border-default px-4 py-3">
          <div class="min-w-0 grow">
            <p class="text-row font-semibold text-highlighted">Action updates</p>
            <p class="text-meta text-muted">{{ triggerLabel }}</p>
          </div>
          <UButton
            v-if="actions.length > 0"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            aria-label="Refresh action updates"
            :loading="refreshing"
            @click="requestRefresh"
          />
        </div>

        <div v-if="error" class="border-b border-default bg-(--ui-error-soft) px-4 py-3" role="alert">
          <p class="text-meta font-medium text-error">Action updates paused</p>
          <p class="mt-0.5 text-meta text-muted">
            {{ apiErrorDetail(error) ?? 'Refresh to try again.' }}
          </p>
          <UButton
            class="mt-2"
            label="Refresh"
            icon="i-lucide-refresh-cw"
            color="error"
            variant="soft"
            size="xs"
            :loading="refreshing"
            @click="requestRefresh"
          />
        </div>

        <ul
          v-if="visibleActions.length > 0"
          class="min-h-0 overflow-y-auto p-2"
          aria-label="Action updates"
        >
          <li
            v-for="action in visibleActions"
            :key="action.id"
            class="rounded-control border-b border-default px-2 py-2.5 last:border-0"
          >
            <div class="flex min-w-0 items-start gap-2">
              <div class="min-w-0 grow">
                <p class="text-eyebrow font-medium uppercase text-dimmed">Component</p>
                <p class="truncate text-row font-semibold text-highlighted">
                  {{ actionDisplayName(action) }}
                </p>
                <dl class="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-meta">
                  <dt class="text-dimmed">Site</dt>
                  <dd class="truncate text-toned">{{ siteName(action) }}</dd>
                  <dt class="text-dimmed">Operation</dt>
                  <dd class="truncate text-toned">{{ actionTypeLabel(action) }}</dd>
                </dl>
              </div>
              <UBadge
                :color="statusTone(action.status)"
                variant="soft"
                size="sm"
                :label="statusLabel(action.status)"
                class="shrink-0"
              />
            </div>

            <UButton
              :to="`/manager/actions/${action.id}`"
              :label="action.status === 'requires_action' && action.requires_action !== false
                ? 'Review and approve'
                : 'View details'"
              trailing-icon="i-lucide-arrow-right"
              color="neutral"
              variant="link"
              size="xs"
              class="mt-1.5 px-0"
              @click="reviewAction(action)"
            />
          </li>
        </ul>

        <div class="border-t border-default p-2">
          <UButton
            to="/manager/actions"
            label="All activity"
            icon="i-lucide-list-checks"
            color="neutral"
            variant="ghost"
            size="sm"
            block
            class="justify-start"
            @click="closePopover"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
