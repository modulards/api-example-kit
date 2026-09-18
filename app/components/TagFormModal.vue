<script setup lang="ts">
import type { Form, FormError, FormSubmitEvent } from '@nuxt/ui';

const props = defineProps<{
  tag?: Tag | null;
}>();

const emit = defineEmits<{
  saved: [tag: Tag];
}>();

const isOpen = defineModel<boolean>('open', { required: true });

const isEditMode = computed(() => !!props.tag);

const NAME_MAX_LENGTH = 30;
const DEFAULT_COLOR = '#A594FF';
const COLOR_SWATCHES = ['#A594FF', '#3ECF8E', '#E0A83C', '#5B9DF9', '#E0616D', '#5FC9C1', '#8B909A'] as const;

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

interface TagFormState {
  name: string;
  color: string;
  order: number;
}

const state = reactive<TagFormState>({ name: '', color: DEFAULT_COLOR, order: 1 });
const submitting = shallowRef(false);

function normalizeTagName(value: string): string {
  return value.trim();
}

function normalizeTagColor(value: string): string {
  return value.trim();
}

function resetState(): void {
  state.name = normalizeTagName(props.tag?.name ?? '');
  state.color = normalizeTagColor(props.tag?.color ?? DEFAULT_COLOR);
  state.order = props.tag?.order ?? 1;
}

watch(isOpen, (value) => {
  if (value) {
    resetState();
  }
}, { immediate: true });

const previewTag = computed<Pick<Tag, 'name' | 'color'>>(() => {
  const color = normalizeTagColor(state.color);

  return {
    name: normalizeTagName(state.name) || 'Tag name',
    color: HEX_PATTERN.test(color) ? color : DEFAULT_COLOR,
  };
});

function selectColor(hex: string): void {
  state.color = hex;
}

function isSelected(hex: string): boolean {
  return normalizeTagColor(state.color).toLowerCase() === normalizeTagColor(hex).toLowerCase();
}

function validate(formState: Partial<TagFormState>): FormError[] {
  const errors: FormError[] = [];
  const name = normalizeTagName(formState.name ?? '');
  const color = normalizeTagColor(formState.color ?? '');

  if (!name) {
    errors.push({ name: 'name', message: 'Name is required.' });
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.push({ name: 'name', message: `Name cannot be longer than ${NAME_MAX_LENGTH} characters.` });
  }

  if (!color) {
    errors.push({ name: 'color', message: 'Color is required.' });
  } else if (!HEX_PATTERN.test(color)) {
    errors.push({ name: 'color', message: 'Color must be a hex value in #RRGGBB format.' });
  }

  if (isEditMode.value && (!formState.order || formState.order < 1)) {
    errors.push({ name: 'order', message: 'Order must be a number greater than or equal to 1.' });
  }

  return errors;
}

function applyApiErrors(error: unknown): void {
  const { errors } = apiErrorData(error);
  const knownFields = new Set<string>(['name', 'color', 'order']);
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

const formRef = ref<Form<TagFormState> | null>(null);

async function onSubmit(event: FormSubmitEvent<TagFormState>) {
  submitting.value = true;

  try {
    const input = {
      name: normalizeTagName(event.data.name),
      color: normalizeTagColor(event.data.color),
    };

    const tag = isEditMode.value && props.tag
      ? (await $fetch(`/api/tags/${props.tag.id}`, {
          method: 'PATCH',
          body: { ...input, order: event.data.order },
        })).tag
      : (await $fetch('/api/tags', {
          method: 'POST',
          body: input,
        })).tag;

    emit('saved', tag);
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
    :title="isEditMode ? 'Edit tag' : 'Add tag'"
    :description="isEditMode ? 'Update the tag.' : 'Add a tag.'"
    :ui="{ content: 'max-w-[420px]' }"
  >
    <template #body>
      <UForm
        id="tag-form"
        ref="formRef"
        :state="state"
        :validate="validate"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField label="Color" name="color" required>
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap gap-1.5">
              <UButton
                v-for="hex in COLOR_SWATCHES"
                :key="hex"
                :style="{ backgroundColor: hex }"
                color="neutral"
                variant="soft"
                square
                :aria-label="`Select color ${hex}`"
                :class="isSelected(hex) ? 'ring-2 ring-primary' : ''"
                @click="selectColor(hex)"
              />
            </div>
            <UInput v-model="state.color" placeholder="#RRGGBB" class="w-32" />
          </div>
        </UFormField>

        <UFormField v-if="isEditMode" label="Order" name="order" required>
          <UInputNumber v-model="state.order" :min="1" class="w-32" />
        </UFormField>

        <UFormField label="Preview">
          <TagBadge :tag="previewTag" />
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
        form="tag-form"
        type="submit"
        :label="isEditMode ? 'Save changes' : 'Add tag'"
        :loading="submitting"
      />
    </template>
  </UModal>
</template>
