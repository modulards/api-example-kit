<script setup lang="ts">
import type { Form, FormError, FormSubmitEvent } from '@nuxt/ui';

const props = defineProps<{
  team?: Team | null;
}>();

const emit = defineEmits<{
  saved: [team: Team];
}>();

const isOpen = defineModel<boolean>('open', { required: true });

const isEditMode = computed(() => !!props.team);

const NAME_MAX_LENGTH = 60;

interface TeamFormState {
  name: string;
}

const state = reactive<TeamFormState>({ name: '' });
const submitting = shallowRef(false);

function resetState(): void {
  state.name = props.team?.name ?? '';
}

watch(isOpen, (value) => {
  if (value) {
    resetState();
  }
}, { immediate: true });

function validate(formState: Partial<TeamFormState>): FormError[] {
  const errors: FormError[] = [];
  const name = formState.name?.trim() ?? '';

  if (!name) {
    errors.push({ name: 'name', message: 'Name is required.' });
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.push({ name: 'name', message: `Name cannot be longer than ${NAME_MAX_LENGTH} characters.` });
  }

  return errors;
}

function applyApiErrors(error: unknown): void {
  const { errors } = apiErrorData(error);
  const knownFields = new Set<string>(['name']);
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

const formRef = ref<Form<TeamFormState> | null>(null);

async function onSubmit(event: FormSubmitEvent<TeamFormState>) {
  submitting.value = true;

  try {
    const name = event.data.name.trim();

    const team = isEditMode.value && props.team
      ? (await $fetch(`/api/teams/${props.team.id}`, {
          method: 'PATCH',
          body: { name },
        })).team
      : (await $fetch('/api/teams', {
          method: 'POST',
          body: { name },
        })).team;

    emit('saved', team);
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
    :title="isEditMode ? 'Edit team' : 'Add team'"
    :description="isEditMode ? 'Update the team name.' : 'Add a team.'"
    :ui="{ content: 'max-w-[420px]' }"
  >
    <template #body>
      <UForm
        id="team-form"
        ref="formRef"
        :state="state"
        :validate="validate"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" class="w-full" />
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
        form="team-form"
        type="submit"
        :label="isEditMode ? 'Save changes' : 'Add team'"
        :loading="submitting"
      />
    </template>
  </UModal>
</template>
