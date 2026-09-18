<script setup lang="ts">
import type { Form, FormError } from '@nuxt/ui';

const isOpen = defineModel<boolean>('open', { required: true });

const MAX_EXPIRY_DAYS = 7;
const DAY_MS = 86_400_000;

interface PluginFormState {
  team: number | null;
  expires_at: string;
}

const state = reactive<PluginFormState>({
  team: null,
  expires_at: '',
});
const submitting = shallowRef(false);
const formRef = ref<Form<PluginFormState> | null>(null);
let requestGeneration = 0;

function resetState(): void {
  state.team = null;
  state.expires_at = '';
}

watch(isOpen, (open) => {
  requestGeneration += 1;

  if (open) {
    submitting.value = false;
    resetState();
    formRef.value?.clear();
  }
});

function toExpiryInstant(value: string): Date {
  return new Date(`${value}T23:59:59`);
}

function validateExpiry(value: string): string | undefined {
  const expiry = toExpiryInstant(value);

  if (Number.isNaN(expiry.getTime())) {
    return 'Enter a valid date.';
  }

  if (expiry.getTime() <= Date.now()) {
    return 'Expiry must be in the future.';
  }

  if (expiry.getTime() > Date.now() + MAX_EXPIRY_DAYS * DAY_MS) {
    return `Expiry cannot be more than ${MAX_EXPIRY_DAYS} days ahead.`;
  }

  return undefined;
}

function validate(formState: Partial<PluginFormState>): FormError[] {
  const errors: FormError[] = [];

  if (formState.team == null) {
    errors.push({ name: 'team', message: 'Team is required.' });
  }

  if (formState.expires_at) {
    const message = validateExpiry(formState.expires_at);

    if (message) {
      errors.push({ name: 'expires_at', message });
    }
  }

  return errors;
}

async function onSubmit(): Promise<void> {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  const generation = requestGeneration;

  try {
    const body: ConnectionPluginInput = { team: state.team as number };

    if (state.expires_at) {
      body.expires_at = toExpiryInstant(state.expires_at).toISOString();
    }

    const archive = await $fetch<Blob>('/api/connection-plugins', { method: 'POST', body });

    if (generation === requestGeneration) {
      const url = URL.createObjectURL(archive);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'modular-connector.zip';
      document.body.append(link);
      link.click();
      link.remove();
      // Give the browser time to consume the object URL before releasing the archive.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      isOpen.value = false;
    }
  } catch (e) {
    if (generation === requestGeneration) {
      notifyApiError(e);
    }
  } finally {
    if (generation === requestGeneration) {
      submitting.value = false;
    }
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="!submitting"
    :close="!submitting"
    title="Download connection plugin"
    description="Install and activate the ZIP in WordPress to connect your website."
    :ui="{
      content: 'max-w-lg',
      header: 'p-6 sm:p-6',
      body: 'p-6 sm:p-6',
      footer: 'px-6 py-4 sm:px-6',
      description: 'mt-2 text-meta leading-relaxed text-muted',
    }"
  >
    <template #body>
      <UForm
        id="connection-plugin-form"
        ref="formRef"
        :state="state"
        :validate="validate"
        class="flex flex-col gap-7"
        @submit="onSubmit"
      >
        <UFormField
          label="Team"
          name="team"
          required
          help="The connected website will be added to this team."
          :ui="{ container: 'mt-2', help: 'mt-2 leading-relaxed' }"
        >
          <TeamSelectionField v-model="state.team" :disabled="submitting" class="w-full" />
        </UFormField>

        <UFormField
          label="Linking expiry"
          name="expires_at"
          hint="Optional"
          help="Choose a date within the next 7 days. Leave blank to use the default expiry."
          :ui="{ container: 'mt-2', help: 'mt-2 leading-relaxed' }"
        >
          <UInput v-model="state.expires_at" type="date" :disabled="submitting" class="w-full" />
        </UFormField>
        <p class="text-meta leading-relaxed text-muted">
          Linking expiry limits when the plugin can connect a new website, not how long it stays connected.
        </p>
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
        form="connection-plugin-form"
        type="submit"
        icon="i-lucide-download"
        :label="submitting ? 'Preparing download…' : 'Download plugin'"
        :loading="submitting"
      />
    </template>
  </UModal>
</template>
