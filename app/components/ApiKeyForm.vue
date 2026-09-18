<script setup lang="ts">
import type { Form, FormError, FormSubmitEvent } from '@nuxt/ui';
import { API_KEY_TOKEN_MAX_LENGTH } from '#shared/constants/api-keys';

const props = defineProps<{
  submitLabel: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  saved: [];
  busy: [value: boolean];
}>();

interface KeyFormState {
  token: string;
}

const state = reactive<KeyFormState>({ token: '' });
const formRef = shallowRef<Form<KeyFormState> | null>(null);
const saving = shallowRef(false);

function validate(formState: Partial<KeyFormState>): FormError[] {
  const errors: FormError[] = [];

  if (!formState.token?.trim()) {
    errors.push({ name: 'token', message: 'The API key is required.' });
  } else if (formState.token.trim().length > API_KEY_TOKEN_MAX_LENGTH) {
    errors.push({ name: 'token', message: `The API key cannot be longer than ${API_KEY_TOKEN_MAX_LENGTH} characters.` });
  }

  return errors;
}

async function onSubmit(event: FormSubmitEvent<KeyFormState>): Promise<void> {
  if (saving.value || props.disabled) {
    return;
  }

  saving.value = true;
  emit('busy', true);

  try {
    await $fetch('/api/key', { method: 'PUT', body: { token: event.data.token.trim() }, retry: 0 });
    state.token = '';
    emit('saved');
  } catch (error) {
    if (apiErrorData(error).code === 'invalid_api_key') {
      formRef.value?.setErrors([{ name: 'token', message: 'The API rejected this key. Check that you pasted it in full.' }]);
    } else {
      notifyApiError(error);
    }

    saving.value = false;
    emit('busy', false);
  }
}
</script>

<template>
  <UForm
    ref="formRef"
    :state="state"
    :validate="validate"
    :disabled="props.disabled || saving"
    class="flex flex-col gap-4"
    @submit="onSubmit"
  >
    <UFormField
      label="API key"
      name="token"
      description="Use an API key from your Modular DS account."
    >
      <UInput
        v-model="state.token"
        type="password"
        :maxlength="API_KEY_TOKEN_MAX_LENGTH"
        placeholder="Paste your Modular DS API key"
        autocomplete="off"
        class="w-full max-w-lg font-mono"
      />
    </UFormField>

    <div>
      <UButton type="submit" :label="props.submitLabel" :loading="saving" :disabled="props.disabled" />
    </div>
  </UForm>
</template>
