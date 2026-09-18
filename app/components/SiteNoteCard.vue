<script setup lang="ts">
import { NOTE_MAX_LENGTH, noteLength } from '#shared/constants/notes';

interface NoteResponse {
  site: SiteNote;
}

const props = defineProps<{
  siteId: string;
}>();

const toast = useToast();

const note = shallowRef('');
const saving = shallowRef(false);
const savedAt = shallowRef<string | null>(null);
const replaceModalOpen = shallowRef(false);
const clearModalOpen = shallowRef(false);

const count = computed(() => noteLength(note.value));

const error = computed(() =>
  count.value > NOTE_MAX_LENGTH
    ? `The note can't be longer than ${NOTE_MAX_LENGTH} characters.`
    : undefined,
);

const canReplace = computed(() => note.value.trim().length > 0 && !error.value);

function requestReplace(): void {
  if (!canReplace.value) {
    return;
  }

  replaceModalOpen.value = true;
}

async function writeNote(value: string | null, title: string): Promise<boolean> {
  saving.value = true;

  try {
    const response = await $fetch<NoteResponse>(`/api/sites/${props.siteId}/notes`, {
      method: 'PATCH',
      body: { note: value },
    });
    note.value = response.site.note ?? '';
    savedAt.value = response.site.updated_at;
    toast.add({
      title,
      description: value === null
        ? 'The private note was cleared.'
        : 'The private note was saved.',
      color: 'success',
    });
    return true;
  } catch (e) {
    notifyApiError(e);
    return false;
  } finally {
    saving.value = false;
  }
}

async function replaceNote(): Promise<void> {
  if (!canReplace.value) {
    return;
  }

  if (await writeNote(note.value, 'Note replaced')) {
    replaceModalOpen.value = false;
  }
}

async function clearNote(): Promise<void> {
  if (await writeNote(null, 'Note cleared')) {
    clearModalOpen.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Private note</h2>
    </template>

    <div class="flex flex-col gap-3">
      <p class="text-meta text-muted">
        Current notes are not shown here. Replacing saves the full text.
      </p>

      <UFormField
        label="Note"
        :error="error"
        :hint="`${count}/${NOTE_MAX_LENGTH}`"
      >
        <UTextarea
          v-model="note"
          :rows="5"
          :disabled="saving"
          placeholder="Enter a note"
          class="w-full"
        />
      </UFormField>

      <p v-if="savedAt" class="text-meta text-muted">
        Saved at {{ formatDateTime(savedAt) }}.
      </p>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UButton
          label="Clear note"
          color="error"
          variant="ghost"
          :disabled="saving"
          @click="clearModalOpen = true"
        />
        <UButton
          label="Replace note"
          color="neutral"
          variant="outline"
          :disabled="!canReplace"
          @click="requestReplace"
        />
      </div>
    </template>
  </UCard>

  <UModal
    v-model:open="replaceModalOpen"
    title="Replace private note"
    :ui="{ content: 'max-w-[420px]' }"
  >
    <template #body>
      <p class="text-row text-toned">
        This replaces the saved note and cannot be undone here.
      </p>
    </template>

    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        :disabled="saving"
        @click="replaceModalOpen = false"
      />
      <UButton
        label="Replace note"
        :loading="saving"
        @click="replaceNote"
      />
    </template>
  </UModal>

  <UModal
    v-model:open="clearModalOpen"
    title="Clear private note"
    :ui="{ content: 'max-w-[420px]' }"
  >
    <template #body>
      <p class="text-row text-toned">
        This permanently removes the saved note.
      </p>
    </template>

    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        :disabled="saving"
        @click="clearModalOpen = false"
      />
      <UButton
        label="Clear note"
        color="error"
        :loading="saving"
        @click="clearNote"
      />
    </template>
  </UModal>
</template>
