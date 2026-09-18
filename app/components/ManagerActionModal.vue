<script setup lang="ts">
import type { ManagerActionRequest, ManagerDispatchResult } from '#shared/types/modular';
import type { SiteItemType } from '#shared/constants/site-items';

const props = withDefaults(defineProps<{
  request: ManagerActionRequest | null;
  componentType?: SiteItemType | null;
  componentName?: string;
  allowedUpgradeModes?: ('safe_upgrade' | 'upgrade')[];
}>(), {
  componentType: null,
  allowedUpgradeModes: () => ['safe_upgrade', 'upgrade'],
});

const emit = defineEmits<{
  dispatched: [result: ManagerDispatchResult];
}>();

const isOpen = defineModel<boolean>('open', { required: true });

type UpgradeChoice = 'safe' | 'direct' | 'scheduled';
type ValidationChoice = 'automatic' | 'manual';
type CleanCacheChoice = 'omit' | 'true' | 'false';

interface RadioOption<T extends string> {
  label: string;
  description: string;
  value: T;
  disabled?: boolean;
}

const upgradeChoice = ref<UpgradeChoice>('safe');
const validationChoice = ref<ValidationChoice>('automatic');
const cleanCacheChoice = ref<CleanCacheChoice>('omit');
const scheduledAt = ref('');
const submitting = ref(false);

const isUpgrade = computed(() =>
  props.request?.action === 'safe_upgrade' || props.request?.action === 'upgrade');
const safeUpgradeAllowed = computed(() => props.allowedUpgradeModes.includes('safe_upgrade'));
const directUpgradeAllowed = computed(() => props.allowedUpgradeModes.includes('upgrade'));
const selectedUpgradeSupported = computed(() => {
  if (!isUpgrade.value) {
    return true;
  }

  return upgradeChoice.value === 'direct' ? directUpgradeAllowed.value : safeUpgradeAllowed.value;
});
const usesSafeUpgrade = computed(() =>
  isUpgrade.value && (upgradeChoice.value === 'safe' || upgradeChoice.value === 'scheduled'));

const upgradeOptions = computed<RadioOption<UpgradeChoice>[]>(() => [
  {
    label: 'Safe update',
    description: 'Validate the update and roll back if it fails.',
    value: 'safe',
    disabled: !safeUpgradeAllowed.value,
  },
  {
    label: 'Direct update',
    description: 'Update immediately without automatic rollback.',
    value: 'direct',
    disabled: !directUpgradeAllowed.value,
  },
  {
    label: 'Scheduled update',
    description: 'Run a safe update at a future date and time.',
    value: 'scheduled',
    disabled: !safeUpgradeAllowed.value,
  },
]);

const validationOptions: RadioOption<ValidationChoice>[] = [
  {
    label: 'Automatic',
    description: 'Complete automatically when validation succeeds.',
    value: 'automatic',
  },
  {
    label: 'Manual',
    description: 'Wait for my approval after validation.',
    value: 'manual',
  },
];

const cleanCacheOptions = [
  { label: 'Organization default', value: 'omit' },
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
] satisfies { label: string; value: CleanCacheChoice }[];

const targetSiteIds = shallowRef<number[]>([]);
const resolvedComponentName = computed(() => props.componentName?.trim() || 'Selected component');
const targetSiteNames = computed(() => {
  const selected = new Set(targetSiteIds.value.map(String));
  return (props.request?.initialSites ?? [])
    .filter((site) => selected.has(site.id) && site.name.trim().length > 0)
    .map((site) => site.name.trim());
});
const targetSummary = computed(() => {
  const count = targetSiteIds.value.length;
  const knownNames = targetSiteNames.value;

  if (knownNames.length === count && count > 0) {
    return knownNames.join(', ');
  }

  const unknownCount = count - knownNames.length;
  const unknownLabel = `${unknownCount} ${unknownCount === 1 ? 'other target site' : 'other target sites'}`;
  return knownNames.length > 0 ? `${knownNames.join(', ')} and ${unknownLabel}` : `${count} ${count === 1 ? 'target site' : 'target sites'}`;
});

function scheduledDateError(): string | null {
  if (upgradeChoice.value !== 'scheduled') {
    return null;
  }

  if (!scheduledAt.value) {
    return 'Choose a date and time.';
  }

  const date = new Date(scheduledAt.value);

  if (Number.isNaN(date.getTime())) {
    return 'Enter a valid date and time.';
  }

  if (date.getTime() <= Date.now()) {
    return 'Scheduled time must be in the future.';
  }

  return null;
}

const scheduledError = computed(() => scheduledDateError());

const title = computed(() => {
  switch (props.request?.action) {
    case 'safe_upgrade':
    case 'upgrade':
      return 'Update component';
    case 'activate':
      return 'Activate component';
    case 'deactivate':
      return 'Deactivate component';
    case 'uninstall':
      return 'Uninstall component';
    default:
      return 'Component action';
  }
});

const description = computed(() => {
  switch (props.request?.action) {
    case 'safe_upgrade':
    case 'upgrade':
      return 'Choose how this component is updated on the specified sites.';
    case 'activate':
      return 'Confirm activation on the specified sites.';
    case 'deactivate':
      return 'Confirm deactivation on the specified sites.';
    case 'uninstall':
      return 'Confirm permanent removal from the specified sites.';
    default:
      return '';
  }
});

const confirmationMessage = computed(() => {
  switch (props.request?.action) {
    case 'activate':
      return props.componentType === 'theme'
        ? 'Activating this theme replaces the active theme on every target site.'
        : 'This component will be activated on every target site.';
    case 'deactivate':
      return 'This component will be deactivated on every target site.';
    case 'uninstall':
      return 'This permanently deletes the component files from every target site.';
    default:
      return null;
  }
});

const submitLabel = computed(() => {
  switch (props.request?.action) {
    case 'activate':
      return 'Activate';
    case 'deactivate':
      return 'Deactivate';
    case 'uninstall':
      return 'Uninstall';
    default:
      return upgradeChoice.value === 'scheduled' ? 'Schedule update' : 'Start update';
  }
});

const submitDisabled = computed(() =>
  submitting.value
  || !props.request
  || targetSiteIds.value.length === 0
  || !selectedUpgradeSupported.value
  || scheduledError.value !== null);

function initialUpgradeChoice(): UpgradeChoice {
  if (props.request?.action === 'upgrade' && directUpgradeAllowed.value) {
    return 'direct';
  }

  if (safeUpgradeAllowed.value) {
    return 'safe';
  }

  return directUpgradeAllowed.value ? 'direct' : 'safe';
}

function resetForm(): void {
  targetSiteIds.value = [...(props.request?.initialSiteIds ?? [])];
  upgradeChoice.value = initialUpgradeChoice();
  validationChoice.value = 'automatic';
  cleanCacheChoice.value = 'omit';
  scheduledAt.value = '';
  submitting.value = false;
}

watch(isOpen, (open) => {
  if (open) {
    resetForm();
  }
}, { immediate: true });

watch(() => props.allowedUpgradeModes, () => {
  if (isOpen.value && !selectedUpgradeSupported.value) {
    upgradeChoice.value = initialUpgradeChoice();
  }
});

function dispatch(request: ManagerActionRequest): Promise<ManagerDispatchResult> {
  const sites = [...targetSiteIds.value];
  let path = `/api/components/${request.componentId}/manage`;
  let method: 'POST' | 'PATCH' = 'PATCH';
  let body: Record<string, unknown> = { sites, action: request.action };

  if (request.action === 'safe_upgrade' || request.action === 'upgrade') {
    const safeUpgrade = upgradeChoice.value !== 'direct';
    path = `/api/components/${request.componentId}/upgrade`;
    method = 'POST';
    body = {
      sites,
      action: safeUpgrade ? 'safe_upgrade' : 'upgrade',
    };

    if (safeUpgrade) {
      body.is_manual = validationChoice.value === 'manual';
    }

    if (cleanCacheChoice.value !== 'omit') {
      body.clean_cache = cleanCacheChoice.value === 'true';
    }

    if (upgradeChoice.value === 'scheduled') {
      body.scheduled_at = new Date(scheduledAt.value).toISOString();
    }
  } else if (request.action === 'uninstall') {
    path = `/api/components/${request.componentId}/uninstall`;
    method = 'POST';
    body = { sites };
  }

  return $fetch<ManagerDispatchResult>(path, { method, body });
}

async function onSubmit(): Promise<void> {
  const request = props.request;

  if (submitting.value || !request || targetSiteIds.value.length === 0 || !selectedUpgradeSupported.value) {
    return;
  }

  if (scheduledDateError()) {
    return;
  }

  submitting.value = true;

  try {
    const result = await dispatch(request);
    emit('dispatched', {
      actions: result.actions ?? [],
      skipped: result.skipped ?? [],
    });
    isOpen.value = false;
  } catch (error) {
    notifyApiError(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="!submitting"
    :close="{ disabled: submitting }"
    :title="title"
    :description="description"
    :ui="{ content: 'max-w-[760px]' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <template v-if="isUpgrade">
          <UFormField label="Update method" required>
            <URadioGroup
              v-model="upgradeChoice"
              :items="upgradeOptions"
              variant="card"
              :disabled="submitting"
              :ui="{ fieldset: 'grid grid-cols-1 gap-2 sm:grid-cols-3' }"
            />
          </UFormField>

          <p v-if="!safeUpgradeAllowed || !directUpgradeAllowed" class="text-meta text-muted">
            Unavailable methods are not supported by every target site.
          </p>

          <UFormField v-if="usesSafeUpgrade" label="Validation" required>
            <URadioGroup
              v-model="validationChoice"
              :items="validationOptions"
              orientation="horizontal"
              :disabled="submitting"
            />
          </UFormField>

          <UFormField label="Clean cache">
            <USelect
              v-model="cleanCacheChoice"
              :items="cleanCacheOptions"
              value-key="value"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="upgradeChoice === 'scheduled'"
            label="Run at"
            required
            :error="scheduledError ?? undefined"
          >
            <UInput
              v-model="scheduledAt"
              type="datetime-local"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>
        </template>

        <UAlert
          v-if="confirmationMessage"
          :color="request?.action === 'uninstall' ? 'error' : 'warning'"
          variant="subtle"
          :icon="request?.action === 'uninstall' ? 'i-lucide-trash-2' : 'i-lucide-triangle-alert'"
          :title="confirmationMessage"
        />

        <div class="rounded-panel border border-default bg-muted/30 p-3">
          <p class="text-row font-medium text-highlighted">{{ resolvedComponentName }}</p>
          <p class="mt-1 break-words text-meta text-muted">
            {{ targetSummary }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        :disabled="submitting"
        @click="isOpen = false"
      />
      <UButton
        :label="submitLabel"
        :color="request?.action === 'uninstall' ? 'error' : 'primary'"
        :loading="submitting"
        :disabled="submitDisabled"
        @click="onSubmit"
      />
    </template>
  </UModal>
</template>
