<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui';
import { MAINTENANCE_BACKGROUND_PATTERN, MAINTENANCE_DESCRIPTION_MAX_LENGTH, MAINTENANCE_TITLE_MAX_LENGTH } from '#shared/constants/maintenance';

function maintenanceStatusLabel(maintenanceStatus: string | null): string {
  if (maintenanceStatus === null) {
    return 'Not configured';
  }

  if (maintenanceStatus === 'enabled') {
    return 'Active';
  }

  if (maintenanceStatus === 'disabled') {
    return 'Disabled';
  }

  return maintenanceStatus;
}

function maintenanceStatusTone(maintenanceStatus: string | null): 'warning' | 'neutral' {
  return maintenanceStatus === 'enabled' ? 'warning' : 'neutral';
}

interface MaintenanceResponse {
  maintenance: SiteMaintenance;
}

interface MaintenanceFormState {
  enabled: boolean;
  title: string;
  description: string;
  background: string;
  noindex: boolean;
}
interface MaintenanceWriteBody {
  status: 'enabled' | 'disabled';
  noindex?: boolean;
  background?: string;
  description?: string;
  title?: string;
}

const props = defineProps<{
  siteId: string;
}>();

const toast = useToast();

const state = reactive<MaintenanceFormState>({
  enabled: false,
  title: '',
  description: '',
  background: '',
  noindex: false,
});
const initialState: MaintenanceFormState = {
  enabled: false,
  title: '',
  description: '',
  background: '',
  noindex: false,
};

const saving = shallowRef(false);

const { data, error, status, refresh } = useFetch<MaintenanceResponse>(
  () => `/api/sites/${props.siteId}/maintenance`,
  { retry: 0 },
);

const maintenance = computed(() => data.value?.maintenance);
const pending = computed(() => status.value === 'pending');

function fillFormFromMaintenance(value: SiteMaintenance | undefined): void {
  const nextState: MaintenanceFormState = {
    enabled: value?.maintenance_status === 'enabled',
    title: value?.maintenance_title ?? '',
    description: value?.maintenance_description ?? '',
    background: value?.maintenance_background ?? '',
    noindex: value?.maintenance_noindex ?? false,
  };
  Object.assign(state, nextState);
  Object.assign(initialState, nextState);
}

watch(maintenance, fillFormFromMaintenance, { immediate: true });

function validate(formState: Partial<MaintenanceFormState>): FormError[] {
  const errors: FormError[] = [];

  if ((formState.title?.length ?? 0) > MAINTENANCE_TITLE_MAX_LENGTH) {
    errors.push({ name: 'title', message: `Title can't be longer than ${MAINTENANCE_TITLE_MAX_LENGTH} characters.` });
  }

  if ((formState.description?.length ?? 0) > MAINTENANCE_DESCRIPTION_MAX_LENGTH) {
    errors.push({ name: 'description', message: `Description can't be longer than ${MAINTENANCE_DESCRIPTION_MAX_LENGTH} characters.` });
  }

  const background = formState.background?.trim() ?? '';

  if (background && !MAINTENANCE_BACKGROUND_PATTERN.test(background)) {
    errors.push({ name: 'background', message: 'Background must be a hex color such as #101014.' });
  }

  return errors;
}

function toMaintenanceInput(values: MaintenanceFormState): MaintenanceWriteBody {
  const input: MaintenanceWriteBody = {
    status: values.enabled ? 'enabled' : 'disabled',
  };

  if (values.noindex !== initialState.noindex) {
    input.noindex = values.noindex;
  }

  if (values.title !== initialState.title && values.title.trim()) {
    input.title = values.title;
  }

  if (values.description !== initialState.description && values.description.trim()) {
    input.description = values.description;
  }

  const background = values.background.trim();

  if (values.background !== initialState.background && background) {
    input.background = background;
  }

  return input;
}

async function onSubmit(event: FormSubmitEvent<MaintenanceFormState>): Promise<void> {
  saving.value = true;

  try {
    const response = await $fetch<MaintenanceResponse>(`/api/sites/${props.siteId}/maintenance`, {
      method: 'PATCH',
      body: toMaintenanceInput(event.data),
    });
    data.value = response;
    toast.add({
      title: 'Changes sent to the site',
      description: 'The site will apply the maintenance page as soon as it receives them.',
      color: 'success',
    });
  } catch (e) {
    notifyApiError(e);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Maintenance mode</h2>
      <div class="grow" />
      <UBadge
        v-if="maintenance"
        :color="maintenanceStatusTone(maintenance.maintenance_status)"
        variant="subtle"
        :label="maintenanceStatusLabel(maintenance.maintenance_status)"
      />
    </template>

    <div v-if="pending && !maintenance" class="flex flex-col gap-3">
      <USkeleton class="h-9 w-full" />
      <USkeleton class="h-9 w-full" />
      <USkeleton class="h-20 w-full" />
    </div>

    <AppErrorState
      v-else-if="error && !maintenance"
      :error="error"
      :retry="refresh"
    />

    <UForm
      v-else
      id="maintenance-form"
      :state="state"
      :validate="validate"
      class="flex flex-col gap-5"
      @submit="onSubmit"
    >
      <USwitch
        v-model="state.enabled"
        label="Show the maintenance page"
        description="While it is on, visitors see the maintenance page instead of the site."
      />

      <div class="flex flex-col gap-4 border-t border-default pt-4">
        <p class="text-row font-medium text-highlighted">
          Customization
        </p>

        <UFormField label="Title" name="title">
          <UInput
            v-model="state.title"
            :maxlength="MAINTENANCE_TITLE_MAX_LENGTH"
            placeholder="We're making improvements"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea
            v-model="state.description"
            :maxlength="MAINTENANCE_DESCRIPTION_MAX_LENGTH"
            :rows="3"
            placeholder="We'll be back in a few minutes."
            class="w-full"
          />
        </UFormField>

        <UFormField label="Background color" name="background">
          <UInput
            v-model="state.background"
            placeholder="#RRGGBB"
            :maxlength="9"
            aria-label="Background color in hexadecimal"
            class="w-36 font-mono uppercase"
          />
        </UFormField>

        <USwitch
          v-model="state.noindex"
          label="Ask search engines not to index the page"
          description="Keeps the maintenance page out of search results."
        />
      </div>
    </UForm>

    <template v-if="!error || maintenance" #footer>
      <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-meta text-muted">
          Changes are sent to the site.
        </p>
        <UButton
          form="maintenance-form"
          type="submit"
          label="Save changes"
          class="self-end sm:self-auto"
          :loading="saving"
          :disabled="pending"
        />
      </div>
    </template>
  </UCard>
</template>
