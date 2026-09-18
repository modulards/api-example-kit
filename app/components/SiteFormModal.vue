<script setup lang="ts">
import type { Form, FormError, FormSubmitEvent } from '@nuxt/ui';

const props = defineProps<{
  site?: Site | null;
}>();

const emit = defineEmits<{
  saved: [result: { siteId: string; connectionRequired: boolean }];
}>();

const isOpen = defineModel<boolean>('open', { required: true });

const isEditMode = computed(() => !!props.site);

const NAME_MAX_LENGTH = 60;
const URI_MAX_LENGTH = 250;

interface SiteFormState {
  name: string;
  team: number | null;
  uri: string;
}

const state = reactive<SiteFormState>({ name: '', team: null, uri: '' });
const submitting = shallowRef(false);

const original = reactive<{ name: string; team: number | null; uri: string }>({ name: '', team: null, uri: '' });

const initialTeamLabel = computed(() => {
  const team = props.site?.team;

  return team ? { id: Number(team.id), name: team.name } : null;
});

function normalizeName(value: string): string {
  return value.trim();
}

function normalizeUri(value: string): string {
  return value.trim();
}

function resetState(): void {
  original.name = normalizeName(props.site?.name ?? '');
  original.team = props.site?.team ? Number(props.site.team.id) : null;
  original.uri = normalizeUri(props.site?.uri ?? '');

  state.name = original.name;
  state.team = original.team;
  state.uri = original.uri;
}

watch(isOpen, (value) => {
  if (value) {
    resetState();
  }
}, { immediate: true });

const uriChanged = computed(() => isEditMode.value && normalizeUri(state.uri) !== original.uri);

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validate(formState: Partial<SiteFormState>): FormError[] {
  const errors: FormError[] = [];
  const name = normalizeName(formState.name ?? '');
  const uri = normalizeUri(formState.uri ?? '');

  if (!name) {
    errors.push({ name: 'name', message: 'Name is required.' });
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.push({ name: 'name', message: `Name cannot be longer than ${NAME_MAX_LENGTH} characters.` });
  }

  if (formState.team == null) {
    errors.push({ name: 'team', message: 'Team is required.' });
  }

  if (!uri) {
    errors.push({ name: 'uri', message: 'URL is required.' });
  } else if (uri.length > URI_MAX_LENGTH) {
    errors.push({ name: 'uri', message: `URL cannot be longer than ${URI_MAX_LENGTH} characters.` });
  } else if (!isValidHttpUrl(uri)) {
    errors.push({ name: 'uri', message: 'URL must be a valid http(s) address.' });
  }

  return errors;
}

function applyApiErrors(error: unknown): void {
  const { errors } = apiErrorData(error);
  const knownFields = new Set<string>(['name', 'team', 'uri']);
  const fieldErrors: FormError[] = [];
  let hasUnmatched = false;

  for (const apiError of errors ?? []) {
    const parameter = apiError.source?.parameter;
    const message = apiError.detail ?? apiError.title;

    if (parameter && message && knownFields.has(parameter)) {
      fieldErrors.push({ name: parameter, message });
    } else {
      hasUnmatched = true;
    }
  }

  if (fieldErrors.length) {
    formRef.value?.setErrors(fieldErrors);
  }

  if (hasUnmatched || fieldErrors.length === 0) {
    notifyApiError(error);
  }
}

const formRef = ref<Form<SiteFormState> | null>(null);

async function onSubmit(event: FormSubmitEvent<SiteFormState>) {
  const name = normalizeName(event.data.name);
  const team = event.data.team;
  const uri = normalizeUri(event.data.uri);

  if (isEditMode.value && props.site) {
    const body: UpdateSiteInput = {};

    if (name !== original.name) {
      body.name = name;
    }

    if (team !== original.team && team !== null) {
      body.team = team;
    }

    if (uri !== original.uri) {
      body.uri = uri;
    }

    if (Object.keys(body).length === 0) {
      isOpen.value = false;

      return;
    }

    submitting.value = true;

    try {
      const response = await $fetch<{ site: Site }>(`/api/sites/${props.site.id}`, {
        method: 'PATCH',
        body,
      });

      emit('saved', { siteId: response.site.id, connectionRequired: uriChanged.value });
      isOpen.value = false;
    } catch (error) {
      applyApiErrors(error);
    } finally {
      submitting.value = false;
    }

    return;
  }

  submitting.value = true;

  try {
    const input: CreateSiteInput = { name, provider: 'wp', uri, team: team as number };
    const response = await $fetch<{ site: Site }>('/api/sites', { method: 'POST', body: input });

    emit('saved', { siteId: response.site.id, connectionRequired: true });
    isOpen.value = false;
  } catch (error) {
    applyApiErrors(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditMode ? 'Edit site' : 'Add site'"
    :description="isEditMode ? 'Update the site details.' : 'Add a WordPress site.'"
    :ui="{ content: 'max-w-[460px]' }"
  >
    <template #body>
      <UForm
        id="site-form"
        ref="formRef"
        :state="state"
        :validate="validate"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField label="Team" name="team" required>
          <TeamSelectionField
            :model-value="state.team"
            :initial-label="initialTeamLabel"
            @update:model-value="state.team = $event"
          />
        </UFormField>

        <UFormField label="URL" name="uri" required>
          <UInput v-model="state.uri" class="w-full" placeholder="https://example.com" />
          <p v-if="uriChanged" class="mt-2 text-meta text-warning">
            Changing the URL requires reconnecting this site.
          </p>
        </UFormField>
      </UForm>
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
        :label="isEditMode ? 'Save changes' : 'Create site'"
        type="submit"
        form="site-form"
        :loading="submitting"
      />
    </template>
  </UModal>
</template>
