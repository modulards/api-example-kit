<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui';
import type { NuxtError } from '#app';
import type { SiteAction, SiteActionStatus, VisualRegression } from '#shared/types/modular';
import { sentenceCase } from '#shared/utils/text';

interface ActionDetailResponse {
  action: SiteAction;
}

const route = useRoute();

const id = computed(() => {
  const raw = route.params.id;
  return Array.isArray(raw) ? (raw[0] ?? '') : raw;
});

const actionUrl = computed(() => `/api/site-actions/${id.value}`);
const { actions: pendingActions, remember } = usePendingActions();
const { data, status, error, refresh } = useFetch<ActionDetailResponse, NuxtError>(actionUrl, { retry: 0 });
const fetchedAction = computed(() => data.value?.action);
const action = computed(() =>
  pendingActions.value.find((candidate) => candidate.id === id.value) ?? fetchedAction.value);
const pending = computed(() => status.value === 'pending' && !action.value);
const isNotFound = computed(() => (error.value as NuxtError | null | undefined)?.statusCode === 404);
const activityRoute = computed(() => ({ path: '/manager/actions', query: route.query }));
watch(fetchedAction, (value) => {
  if (value) {
    remember([value]);
  }
}, { immediate: true });

const title = computed(() => action.value ? actionDisplayName(action.value) : 'Action');

useHead(() => ({ title: title.value }));

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: 'Activity', to: activityRoute.value },
  { label: title.value },
]);

type StatusTone = 'neutral' | 'info' | 'error' | 'success' | 'warning';

const STATUS_TONE: Record<SiteActionStatus, StatusTone> = {
  pending: 'neutral',
  in_progress: 'info',
  failed: 'error',
  done: 'success',
  requires_action: 'warning',
};

function statusTone(status: SiteActionStatus): StatusTone {
  return STATUS_TONE[status];
}

function statusLabel(status: SiteActionStatus): string {
  return sentenceCase(status.replaceAll('_', ' '));
}

const managedItems = computed(() => action.value?.managed_items ?? []);

const steps = computed(() => action.value?.steps ?? []);

function stepTypeLabel(type: string): string {
  return sentenceCase(type.replaceAll(/[._]/g, ' '));
}

const visual = computed<VisualRegression | undefined>(() => action.value?.visual_regression ?? undefined);

function changeLabel(change: number | null): string {
  return change == null ? '—' : `${change.toFixed(2)}%`;
}

type ScreenshotKey = 'before' | 'after' | 'diff';

const SCREENSHOT_KEYS: ScreenshotKey[] = ['before', 'after', 'diff'];
const SCREENSHOT_LABEL: Record<ScreenshotKey, string> = { before: 'Before', after: 'After', diff: 'Diff' };

const failedScreenshots = ref<Record<ScreenshotKey, boolean>>({ before: false, after: false, diff: false });

function markScreenshotFailed(key: ScreenshotKey): void {
  failedScreenshots.value[key] = true;
}

// An explicit refresh may provide renewed signed URLs.
watch(() => JSON.stringify(action.value?.visual_regression?.screenshots ?? null), () => {
  failedScreenshots.value = { before: false, after: false, diff: false };
});

// `requires_action` says whether a decision is still open: https://api.docs.modulards.com/modular-ds-public-api/site-actions/show-site-action
const canDecide = computed(() =>
  action.value?.type === 'manager.safe_upgrade'
  && action.value.status === 'requires_action'
  && action.value.requires_action === true);

const decisionUnavailable = computed(() =>
  action.value?.type === 'manager.safe_upgrade'
  && action.value.status === 'requires_action'
  && action.value.requires_action === false);

type Decision = 'approve' | 'rollback';

const pendingDecision = shallowRef<Decision | null>(null);
const confirming = shallowRef(false);
const decisionError = shallowRef<unknown>(null);

const decisionModalOpen = computed({
  get: () => pendingDecision.value !== null,
  set: (open: boolean) => {
    if (!open) {
      pendingDecision.value = null;
    }
  },
});

const DECISION_META: Record<Decision, { title: string; description: string; label: string }> = {
  approve: {
    title: 'Approve safe upgrade',
    description: 'The upgraded version is kept and applied to the site. This records your decision with the API.',
    label: 'Yes, approve',
  },
  rollback: {
    title: 'Roll back safe upgrade',
    description: 'The site is reverted to the previous version. This records your decision with the API.',
    label: 'Yes, roll back',
  },
};

function openDecision(decision: Decision): void {
  decisionError.value = null;
  pendingDecision.value = decision;
}

async function confirmDecision(): Promise<void> {
  const decision = pendingDecision.value;
  const actionId = id.value;

  if (!decision || !actionId || confirming.value) {
    return;
  }

  confirming.value = true;
  decisionError.value = null;

  try {
    const response = await $fetch<ActionDetailResponse>(`/api/site-actions/${actionId}/validate`, {
      method: 'POST',
      body: { action: decision },
    });
    const updatedAction = action.value
      ? { ...action.value, ...response.action }
      : response.action;
    data.value = { action: updatedAction };
    remember([updatedAction]);
    pendingDecision.value = null;
  } catch (e) {
    decisionError.value = e;
    notifyApiError(e);
  } finally {
    confirming.value = false;
  }
}
</script>

<template>
  <div>
    <AppNavbar>
      <template #left>
        <UBreadcrumb :items="breadcrumbItems" :ui="{ link: 'text-row', separatorIcon: 'size-3.5' }" />
      </template>
      <template #right>
        <UButton
          label="Refresh"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          :loading="status === 'pending'"
          @click="() => refresh()"
        />
      </template>
    </AppNavbar>

    <div class="px-4 py-6 sm:px-6">
      <div v-if="pending" class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <USkeleton class="h-6 w-64" />
          <USkeleton class="h-3.5 w-40" />
        </div>
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
          <USkeleton class="h-56 rounded-panel" />
          <USkeleton class="h-56 rounded-panel" />
        </div>
      </div>

      <template v-else-if="error && !action">
        <UEmpty
          v-if="isNotFound"
          icon="i-lucide-search-x"
          title="This action doesn't exist or isn't in your account"
          description="It may have been removed, or the link may be wrong."
          size="lg"
        >
          <template #actions>
            <UButton label="Back to activity" icon="i-lucide-arrow-left" :to="activityRoute" color="neutral" variant="subtle" />
          </template>
        </UEmpty>

        <AppErrorState v-else :error="error" size="lg" :retry="refresh">
          <template #actions>
            <UButton label="Back to activity" icon="i-lucide-arrow-left" :to="activityRoute" color="neutral" variant="ghost" />
          </template>
        </AppErrorState>
      </template>

      <div v-else-if="action" class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center gap-2.5">
          <h1 class="min-w-0 truncate text-page-title font-semibold text-highlighted">
            {{ title }}
          </h1>
          <UBadge :color="statusTone(action.status)" variant="soft" :label="statusLabel(action.status)" />
          <span v-if="action.origin" class="text-meta text-muted">{{ sentenceCase(action.origin) }}</span>
        </div>

        <UCard v-if="error" :ui="{ body: 'p-0 sm:p-0' }">
          <AppErrorState :error="error" :retry="refresh" />
        </UCard>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
          <UCard>
            <template #header>
              <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Details</h2>
            </template>

            <dl class="flex flex-col gap-3">
              <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <dt class="shrink-0 text-meta text-dimmed">Site</dt>
                <dd class="w-full min-w-0 break-words text-meta sm:w-auto sm:truncate sm:text-right">
                  <NuxtLink
                    v-if="action.site"
                    :to="`/sites/${action.site.id}`"
                    class="font-medium text-highlighted transition-colors hover:text-primary"
                  >
                    {{ action.site.name }}
                  </NuxtLink>
                  <span v-else class="text-dimmed">—</span>
                </dd>
              </div>

              <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <dt class="shrink-0 text-meta text-dimmed">Started</dt>
                <dd class="break-words text-meta text-toned sm:text-right">{{ formatDateTime(action.started_at) }}</dd>
              </div>

              <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <dt class="shrink-0 text-meta text-dimmed">Completed</dt>
                <dd class="break-words text-meta text-toned sm:text-right">{{ formatDateTime(action.completed_at) }}</dd>
              </div>

              <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <dt class="shrink-0 text-meta text-dimmed">Created</dt>
                <dd class="break-words text-meta text-toned sm:text-right">{{ formatDateTime(action.created_at) }}</dd>
              </div>

              <div v-if="action.scheduled_at" class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <dt class="shrink-0 text-meta text-dimmed">Scheduled</dt>
                <dd class="break-words text-meta text-warning sm:text-right">Scheduled for {{ formatDateTime(action.scheduled_at) }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard v-if="managedItems.length > 0">
            <template #header>
              <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Managed items</h2>
            </template>

            <ul class="flex flex-col gap-3">
              <li v-for="(item, index) in managedItems" :key="`${item.site_item_id ?? 'unknown'}-${index}`" class="flex min-w-0 flex-col gap-0.5 leading-tight">
                <span class="truncate text-row font-medium text-highlighted">{{ item.name ?? 'Unknown item' }}</span>
                <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-meta">
                  <span class="font-mono text-mono-sm text-dimmed">{{ item.slug ?? '—' }}</span>
                  <span v-if="item.type" class="text-dimmed">{{ sentenceCase(item.type) }}</span>
                  <span class="font-mono text-mono-sm text-toned">{{ item.from_version ?? '—' }} → {{ item.to_version ?? '—' }}</span>
                </div>
              </li>
            </ul>
          </UCard>

          <UCard v-else>
            <template #header>
              <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Managed items</h2>
            </template>

            <p class="text-meta text-muted">No items were recorded for this action.</p>
          </UCard>
        </div>

        <UCard v-if="steps.length > 0">
          <template #header>
            <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Steps</h2>
          </template>

          <ol class="flex flex-col gap-3">
            <li v-for="step in steps" :key="step.id" class="flex min-w-0 flex-col gap-1 leading-tight">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <span class="truncate text-row font-medium text-highlighted">{{ stepTypeLabel(step.type) }}</span>
                <UBadge :color="statusTone(step.status)" variant="soft" size="sm" :label="statusLabel(step.status)" />
              </div>
              <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-meta text-muted">
                <span class="text-dimmed">Attempts {{ step.attempts }}</span>
                <span>Started {{ formatDateTime(step.started_at) }}</span>
                <span>Completed {{ formatDateTime(step.completed_at) }}</span>
              </div>
            </li>
          </ol>
        </UCard>

        <UCard v-if="visual">
          <template #header>
            <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Visual comparison</h2>
          </template>

          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta">
              <span class="text-muted">Change <span class="font-mono text-mono text-toned">{{ changeLabel(visual.change_percentage) }}</span> of <span class="font-mono text-mono text-toned">{{ visual.threshold }}%</span> threshold</span>
              <span class="w-full min-w-0 break-words text-muted sm:w-auto sm:truncate">Success path <span class="font-mono text-mono text-toned">{{ visual.success_path }}</span></span>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <figure v-for="key in SCREENSHOT_KEYS" :key="key" class="flex min-w-0 flex-col gap-1.5">
                <figcaption class="text-meta text-dimmed">{{ SCREENSHOT_LABEL[key] }}</figcaption>
                <img
                  v-if="visual.screenshots[key] && !failedScreenshots[key]"
                  :src="visual.screenshots[key] ?? undefined"
                  :alt="`${SCREENSHOT_LABEL[key]} screenshot`"
                  loading="lazy"
                  class="w-full rounded-panel border border-default"
                  @error="markScreenshotFailed(key)"
                >
                <p v-else-if="visual.screenshots[key] && failedScreenshots[key]" class="text-meta text-warning">
                  Screenshot URL expired
                </p>
              </figure>
            </div>
          </div>
        </UCard>

        <UCard v-if="canDecide || decisionUnavailable">
          <template #header>
            <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Safe upgrade decision</h2>
          </template>

          <div v-if="canDecide" class="flex flex-wrap items-center gap-2.5">
            <UButton label="Approve" icon="i-lucide-check" @click="openDecision('approve')" />
            <UButton label="Roll back" icon="i-lucide-undo-2" color="neutral" variant="outline" @click="openDecision('rollback')" />
          </div>

          <p v-else-if="decisionUnavailable" class="text-meta text-muted">Decision unavailable. The approval window has closed.</p>
        </UCard>
      </div>
    </div>

    <UModal
      v-model:open="decisionModalOpen"
      :title="pendingDecision ? DECISION_META[pendingDecision].title : ''"
      :description="pendingDecision ? DECISION_META[pendingDecision].description : ''"
      :ui="{ content: 'max-w-[460px]' }"
    >
      <template #body>
        <UAlert
          v-if="decisionError"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Decision not submitted"
          :description="apiErrorDetail(decisionError) ?? 'The action was not changed.'"
        />
      </template>
      <template #footer>
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="confirming"
          @click="decisionModalOpen = false"
        />
        <UButton
          v-if="pendingDecision"
          :label="DECISION_META[pendingDecision].label"
          :loading="confirming"
          @click="confirmDecision"
        />
      </template>
    </UModal>
  </div>
</template>
