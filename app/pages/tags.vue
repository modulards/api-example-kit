<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';

useHead({ title: 'Tags' });

const { filter, page, query, reset, activeCount } = useListFilters(['q']);
const searchFilter = filter('q');
const searchInput = ref(searchFilter.value[0] ?? '');

function applySearch(): void {
  searchFilter.value = searchInput.value ? [searchInput.value] : [];
}

watch(searchFilter, (value) => {
  searchInput.value = value[0] ?? '';
});

const { data, status, error, refresh } = useFetch('/api/tags', {
  query,
  retry: 0,
});

const tags = computed(() => data.value?.items ?? []);
const isLoadingTags = computed(() => status.value === 'pending');
const totalTags = computed(() => data.value?.meta.total ?? tags.value.length);

const toast = useToast();

const formOpen = ref(false);
const formTag = ref<Tag | null>(null);
const deleteOpen = ref(false);
const tagToDelete = ref<Tag | null>(null);
const deleting = ref(false);

function openCreate(): void {
  formTag.value = null;
  formOpen.value = true;
}

function openEdit(tag: Tag): void {
  formTag.value = tag;
  formOpen.value = true;
}

function openDelete(tag: Tag): void {
  tagToDelete.value = tag;
  deleteOpen.value = true;
}

function onSaved(): void {
  const wasEdit = !!formTag.value;
  formTag.value = null;
  refresh();
  toast.add({
    title: wasEdit ? 'Tag saved' : 'Tag created',
    color: 'success',
  });
}

async function deleteTag(): Promise<void> {
  const tag = tagToDelete.value;

  if (!tag) {
    return;
  }

  deleting.value = true;

  try {
    await $fetch(`/api/tags/${tag.id}`, { method: 'DELETE' });
    deleteOpen.value = false;
    tagToDelete.value = null;
    refresh();
    toast.add({ title: 'Tag deleted', color: 'success' });
  } catch (e) {
    notifyApiError(e);
  } finally {
    deleting.value = false;
  }
}

function actionsFor(tag: Tag): DropdownMenuItem[] {
  return [
    { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(tag) },
    { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDelete(tag) },
  ];
}

const columns: TableColumn<Tag>[] = [
  { id: 'name', header: 'Tag' },
  { id: 'actions', header: '' },
];
</script>

<template>
  <AppNavbar title="Tags">
    <template #trailing>
      <span v-if="data" class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ totalTags }}</span>
    </template>

    <template #right>
      <UButton
        to="/sites"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        label="Sites"
      />
      <UButton label="Add tag" icon="i-lucide-plus" @click="openCreate" />
    </template>
  </AppNavbar>

  <UDashboardToolbar>
    <template #left>
      <UInput
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="Search tags"
        aria-label="Search tags"
        class="w-full sm:w-70"
        @keydown.enter="applySearch"
      />
    </template>

    <template #right>
      <UButton
        v-if="activeCount > 0"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        label="Clear filters"
        @click="reset"
      />
    </template>
  </UDashboardToolbar>

  <div class="flex flex-col gap-5 px-4 py-6 sm:px-6">
    <UCard v-if="error" :ui="{ body: 'p-0 sm:p-0' }">
      <AppErrorState :error="error" size="lg" :retry="refresh" />
    </UCard>

    <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="tags"
        :columns="columns"
        :loading="isLoadingTags"
        loading-color="primary"
        loading-animation="carousel"
      >
        <template #empty>
          <UEmpty
            icon="i-lucide-tag"
            :title="activeCount > 0 ? 'No tags match this search' : 'No tags yet'"
            :description="activeCount > 0 ? 'Try another search or clear the filter.' : 'Create a tag to organize sites.'"
            :size="activeCount > 0 ? 'md' : 'lg'"
          >
            <template #actions>
              <UButton label="Add tag" icon="i-lucide-plus" variant="subtle" @click="openCreate" />
            </template>
          </UEmpty>
        </template>

        <template #name-cell="{ row }">
          <TagBadge :tag="row.original" />
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UDropdownMenu :items="actionsFor(row.original)">
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                square
                :aria-label="`Actions for ${row.original.name}`"
              />
            </UDropdownMenu>
          </div>
        </template>
      </UTable>
    </UCard>

    <AppPaginationFooter
      v-if="data && totalTags > 0"
      v-model:page="page"
      :total="totalTags"
      :per-page="data.meta.perPage"
    />

    <TagFormModal v-model:open="formOpen" :tag="formTag" @saved="onSaved" />

    <UModal v-model:open="deleteOpen" title="Delete tag" :ui="{ content: 'max-w-[420px]' }">
      <template #body>
        <div class="flex items-start gap-3">
          <UAvatar icon="i-lucide-trash-2" color="error" :ui="{ root: 'rounded-control ring ring-error/25' }" />

          <div class="flex min-w-0 flex-col gap-2">
            <p v-if="tagToDelete" class="text-row text-toned">
              You are about to delete the tag
              <TagBadge :tag="tagToDelete" class="mx-0.5" />
            </p>
            <p class="text-meta text-muted">
              This removes the tag from sites and cannot be undone.
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="deleting"
          @click="deleteOpen = false"
        />
        <UButton
          label="Delete tag"
          color="error"
          :loading="deleting"
          @click="deleteTag"
        />
      </template>
    </UModal>
  </div>
</template>
