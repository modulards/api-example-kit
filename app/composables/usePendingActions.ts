import type { Ref } from 'vue';
import type { Page, SiteAction, SiteActionStatus } from '#shared/types/modular';

const POLL_INTERVAL_MS = 10_000;
const COMPLETION_TTL_MS = 8_000;
const MAX_TIMEOUT_MS = 2_147_000_000;

interface PendingActionPresentation {
  reviewedStatus?: SiteActionStatus;
  completedUntil?: number;
}

export function usePendingActions(): {
  actions: Ref<SiteAction[]>;
  presentation: Ref<Record<string, PendingActionPresentation>>;
  remember: (latest: SiteAction[], componentName?: string) => void;
  markReviewed: (action: SiteAction) => void;
  clearExpiredCompletions: (now?: number) => void;
} {
  const actions = useState<SiteAction[]>('known-site-actions', () => []);
  const presentation = useState<Record<string, PendingActionPresentation>>(
    'known-site-actions-presentation',
    () => ({}),
  );

  function remember(latest: SiteAction[], componentName?: string): void {
    if (latest.length === 0) {
      return;
    }

    const existingById = new Map(actions.value.map((action) => [action.id, action]));
    let nextPresentation = { ...presentation.value };

    for (const snapshot of latest) {
      const existing = existingById.get(snapshot.id);
      const knownManagedItems = snapshot.managed_items?.length
        ? snapshot.managed_items
        : existing?.managed_items;
      const managedItems = knownManagedItems?.length || !componentName
        ? knownManagedItems
        : [{
            site_item_id: null,
            name: componentName,
            slug: null,
            type: null,
            from_version: null,
            to_version: null,
          }];

      existingById.set(snapshot.id, {
        ...existing,
        ...snapshot,
        site: snapshot.site ?? existing?.site,
        managed_items: managedItems,
      });

      if (existing && existing.status !== snapshot.status) {
        const previousPresentation = nextPresentation[snapshot.id];

        if (snapshot.status === 'done') {
          nextPresentation[snapshot.id] = { completedUntil: Date.now() + COMPLETION_TTL_MS };
        } else if (previousPresentation) {
          nextPresentation = Object.fromEntries(
            Object.entries(nextPresentation).filter(([id]) => id !== snapshot.id),
          );
        }
      }
    }

    actions.value = [...existingById.values()];
    presentation.value = nextPresentation;
  }

  function markReviewed(action: SiteAction): void {
    presentation.value = {
      ...presentation.value,
      [action.id]: {
        ...presentation.value[action.id],
        reviewedStatus: action.status,
      },
    };
  }

  function clearExpiredCompletions(now = Date.now()): void {
    const entries = Object.entries(presentation.value);
    const retainedEntries = entries.filter(([, state]) =>
      state.completedUntil === undefined || state.completedUntil > now);

    if (retainedEntries.length !== entries.length) {
      presentation.value = Object.fromEntries(retainedEntries);
    }
  }

  return {
    actions,
    presentation,
    remember,
    markReviewed,
    clearExpiredCompletions,
  };
}

export function usePendingActionStatus(): {
  error: Ref<unknown>;
  refreshing: Ref<boolean>;
  requestRefresh: () => void;
} {
  const error = useState<unknown>('known-site-actions-poll-error', () => null);
  const refreshing = useState<boolean>('known-site-actions-refreshing', () => false);
  const refreshRequest = useState<number>('known-site-actions-refresh-request', () => 0);

  function requestRefresh(): void {
    refreshRequest.value += 1;
  }

  return { error, refreshing, requestRefresh };
}

export function usePendingActionPolling(): void {
  const { actions, remember } = usePendingActions();
  const refreshRequest = useState<number>('known-site-actions-refresh-request', () => 0);
  const { error, refreshing } = usePendingActionStatus();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let polling = false;
  let mounted = false;
  let cycleIds: string[] = [];
  let cyclePage = 1;

  function eligibleActionIds(): string[] {
    const now = Date.now();

    return actions.value
      .filter((action) => {
        if (action.status === 'in_progress') {
          return true;
        }

        if (action.status !== 'pending' || !action.scheduled_at) {
          return action.status === 'pending';
        }

        const scheduledAt = Date.parse(action.scheduled_at);
        return !Number.isFinite(scheduledAt) || scheduledAt <= now;
      })
      .map((action) => action.id);
  }

  function nextScheduledDelay(): number | undefined {
    const now = Date.now();
    const delays = actions.value
      .filter((action) => action.status === 'pending' && action.scheduled_at)
      .map((action) => Date.parse(action.scheduled_at!) - now)
      .filter((delay) => Number.isFinite(delay) && delay > 0);

    if (delays.length === 0) {
      return undefined;
    }

    return Math.min(Math.min(...delays), MAX_TIMEOUT_MS);
  }

  function stopTimer(): void {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function canPoll(): boolean {
    return mounted && document.visibilityState === 'visible';
  }

  function schedule(delay: number): void {
    stopTimer();
    timer = setTimeout(() => {
      timer = undefined;
      void pollNextPage();
    }, delay);
  }

  function scheduleForKnownActions(delay = POLL_INTERVAL_MS): void {
    if (!canPoll() || error.value || polling) {
      return;
    }

    if (cycleIds.length > 0 || eligibleActionIds().length > 0) {
      schedule(delay);
      return;
    }

    const scheduledDelay = nextScheduledDelay();

    if (scheduledDelay !== undefined) {
      schedule(scheduledDelay);
    }
  }

  async function pollNextPage(): Promise<void> {
    if (!canPoll() || polling || error.value) {
      return;
    }

    if (cycleIds.length === 0) {
      cycleIds = eligibleActionIds();
      cyclePage = 1;
    }

    if (cycleIds.length === 0) {
      scheduleForKnownActions();
      return;
    }

    polling = true;
    refreshing.value = true;
    const requestController = new AbortController();
    controller = requestController;

    try {
      const response = await $fetch<Page<SiteAction>>('/api/site-actions', {
        retry: 0,
        query: { ids: cycleIds, page: cyclePage },
        signal: requestController.signal,
      });

      if (requestController.signal.aborted || !canPoll()) {
        return;
      }

      remember(response.items);

      if (response.meta.currentPage < response.meta.lastPage) {
        cyclePage = response.meta.currentPage + 1;
      } else {
        cycleIds = [];
        cyclePage = 1;
      }
    } catch (pollError) {
      if (!requestController.signal.aborted) {
        error.value = pollError;
        cycleIds = [];
        cyclePage = 1;
      }
    } finally {
      polling = false;
      refreshing.value = false;
      controller = undefined;
      scheduleForKnownActions();
    }
  }

  async function refresh(): Promise<void> {
    if (!canPoll() || polling || cycleIds.length > 0 || actions.value.length === 0) {
      return;
    }

    error.value = null;
    cycleIds = actions.value.map((action) => action.id);
    cyclePage = 1;
    stopTimer();
    await pollNextPage();
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      stopTimer();
      controller?.abort();
      cycleIds = [];
      cyclePage = 1;
      return;
    }

    scheduleForKnownActions(0);
  }

  watch(refreshRequest, () => {
    void refresh();
  });

  watch(actions, () => {
    scheduleForKnownActions();
  });

  onMounted(() => {
    mounted = true;
    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleForKnownActions();
  });

  onUnmounted(() => {
    mounted = false;
    stopTimer();
    controller?.abort();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
}
