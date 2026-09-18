<script setup lang="ts">
interface TagOption { label: string; value: string; tag: Tag }

const props = defineProps<{
  site: Site;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const isOpen = defineModel<boolean>('open', { required: true });
const toast = useToast();
const tagSearchTerm = shallowRef('');
const tagsQuery = computed(() => ({ q: tagSearchTerm.value || undefined }));

const { data: tagsData, status: tagsStatus, error: tagsError, refresh: refreshTags } = useFetch('/api/tags', {
  query: tagsQuery,
  immediate: false,
  watch: false,
  retry: 0,
});

const knownTags = shallowRef(new Map<string, Tag>());

watch(() => props.site.id, () => {
  knownTags.value = new Map((props.site.tags ?? []).map((tag) => [tag.id, tag]));
}, { immediate: true });

watch(() => props.site.tags, (siteTags) => {
  const tags = new Map(knownTags.value);

  for (const tag of siteTags ?? []) {
    tags.set(tag.id, tag);
  }

  knownTags.value = tags;
}, { immediate: true });

watch(tagsData, (data) => {
  if (!data) {
    return;
  }

  const tags = new Map(knownTags.value);

  for (const tag of data.items) {
    tags.set(tag.id, tag);
  }

  knownTags.value = tags;
}, { immediate: true });

const allTags = computed(() => [...knownTags.value.values()]);

const tagOptions = computed<TagOption[]>(() =>
  allTags.value.map((tag) => ({ label: tag.name, value: tag.id, tag })),
);

const selectedIds = shallowRef<string[]>([]);
const submitting = shallowRef(false);
watch(isOpen, (open) => {
  if (!open) {
    return;
  }

  selectedIds.value = (props.site.tags ?? []).map((tag) => tag.id);

  if (tagSearchTerm.value) {
    tagSearchTerm.value = '';
  } else {
    void refreshTags();
  }
}, { immediate: true });

watch(tagSearchTerm, () => {
  if (isOpen.value) {
    void refreshTags();
  }
});

const selectedTags = computed(() => allTags.value.filter((tag) => selectedIds.value.includes(tag.id)));

async function onSave() {
  const currentIds = new Set((props.site.tags ?? []).map((tag) => tag.id));
  const nextIds = new Set(selectedIds.value);

  const addTagIds = selectedIds.value.filter((id) => !currentIds.has(id));
  const removeTagIds = [...currentIds].filter((id) => !nextIds.has(id));

  if (addTagIds.length === 0 && removeTagIds.length === 0) {
    isOpen.value = false;
    return;
  }

  submitting.value = true;

  try {
    await $fetch(`/api/sites/${props.site.id}/tags`, {
      method: 'PATCH',
      body: { addTagIds, removeTagIds },
    });
    toast.add({ title: 'Tags updated', color: 'success' });
    emit('saved');
    isOpen.value = false;
  } catch (error) {
    notifyApiError(error);
  } finally {
    submitting.value = false;
  }
}

async function retryTags(): Promise<void> {
  await refreshTags();
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Manage tags"
    :description="`Choose tags for ${site.name}.`"
    :ui="{ content: 'max-w-[420px]' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <USelectMenu
          v-model="selectedIds"
          v-model:search-term="tagSearchTerm"
          :items="tagOptions"
          value-key="value"
          multiple
          ignore-filter
          :loading="tagsStatus === 'pending'"
          :disabled="!!tagsError"
          :placeholder="tagsError ? 'Tags unavailable' : 'Search or select tags'"
          class="w-full"
        >
          <template #item-leading="{ item }">
            <span
              class="inline-block size-3 rounded-full border border-default"
              :style="{ backgroundColor: (item as TagOption).tag.color }"
              aria-hidden="true"
            />
          </template>
        </USelectMenu>

        <div v-if="tagsError" class="flex items-center justify-between gap-2 text-meta text-error">
          <span>Could not load tags.</span>
          <UButton
            label="Retry"
            color="neutral"
            size="sm"
            :loading-auto="true"
            @click="retryTags"
          />
        </div>

        <div v-if="selectedTags.length" class="flex flex-wrap gap-1.5">
          <TagBadge v-for="tag in selectedTags" :key="tag.id" :tag="tag" />
        </div>
        <p v-else class="text-meta text-dimmed">
          No tags selected
        </p>
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
        label="Save"
        :disabled="!!tagsError"
        :loading="submitting"
        @click="onSave"
      />
    </template>
  </UModal>
</template>
