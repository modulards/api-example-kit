<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';

useHead({ title: 'Teams' });

const { filter, page, query, reset, activeCount } = useListFilters(['q']);
const searchFilter = filter('q');
const searchInput = ref(searchFilter.value[0] ?? '');

function applySearch(): void {
  searchFilter.value = searchInput.value ? [searchInput.value] : [];
}

watch(searchFilter, (value) => {
  searchInput.value = value[0] ?? '';
});

const { data, status, error, refresh } = useFetch('/api/teams', {
  query,
  retry: 0,
});

const teams = computed(() => data.value?.items ?? []);
const isLoadingTeams = computed(() => status.value === 'pending');
const totalTeams = computed(() => data.value?.meta.total ?? teams.value.length);

const toast = useToast();

const formOpen = ref(false);
const formTeam = ref<Team | null>(null);
const deleteOpen = ref(false);
const teamToDelete = ref<Team | null>(null);
const deleting = ref(false);

function openCreate(): void {
  formTeam.value = null;
  formOpen.value = true;
}

function openEdit(team: Team): void {
  formTeam.value = team;
  formOpen.value = true;
}

function openDelete(team: Team): void {
  teamToDelete.value = team;
  deleteOpen.value = true;
}

function onSaved(team: Team): void {
  const wasEdit = !!formTeam.value;
  formTeam.value = team;
  refresh();
  toast.add({
    title: wasEdit ? 'Team saved' : 'Team created',
    color: 'success',
  });
}

async function deleteTeam(): Promise<void> {
  const team = teamToDelete.value;

  if (!team) {
    return;
  }

  deleting.value = true;

  try {
    await $fetch(`/api/teams/${team.id}`, { method: 'DELETE' });
    deleteOpen.value = false;
    teamToDelete.value = null;
    refresh();
    toast.add({ title: 'Team deleted', color: 'success' });
  } catch (e) {
    notifyApiError(e);
  } finally {
    deleting.value = false;
  }
}

function actionsFor(team: Team): DropdownMenuItem[] {
  return [
    { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(team) },
    { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDelete(team) },
  ];
}

const columns: TableColumn<Team>[] = [
  { id: 'name', header: 'Team' },
  { id: 'actions', header: '' },
];
</script>

<template>
  <AppNavbar title="Teams">
    <template #trailing>
      <span v-if="data" class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ totalTeams }}</span>
    </template>

    <template #right>
      <UButton
        to="/sites"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        label="Sites"
      />
      <UButton to="/tags" color="neutral" variant="link" icon="i-lucide-tag" label="Tags" />
      <UButton label="Add team" icon="i-lucide-plus" @click="openCreate" />
    </template>
  </AppNavbar>

  <UDashboardToolbar>
    <template #left>
      <UInput
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="Search teams"
        aria-label="Search teams"
        class="w-full sm:w-64"
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
        :data="teams"
        :columns="columns"
        :loading="isLoadingTeams"
        loading-color="primary"
        loading-animation="carousel"
      >
        <template #empty>
          <UEmpty
            icon="i-lucide-users"
            :title="activeCount > 0 ? 'No teams match this search' : 'No teams yet'"
            :description="activeCount > 0 ? 'Try another search or clear the filter.' : 'Create a team to organize sites.'"
            :size="activeCount > 0 ? 'md' : 'lg'"
          >
            <template #actions>
              <UButton label="Add team" icon="i-lucide-plus" variant="subtle" @click="openCreate" />
            </template>
          </UEmpty>
        </template>

        <template #name-cell="{ row }">
          <NuxtLink
            :to="{ path: '/sites', query: { team: [row.original.id] } }"
            class="group block min-w-0 truncate font-medium text-highlighted transition-colors group-hover:text-primary"
          >
            {{ row.original.name }}
          </NuxtLink>
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
      v-if="data && totalTeams > 0"
      v-model:page="page"
      :total="totalTeams"
      :per-page="data.meta.perPage"
    />

    <TeamFormModal v-model:open="formOpen" :team="formTeam" @saved="onSaved" />

    <UModal v-model:open="deleteOpen" title="Delete team" :ui="{ content: 'max-w-[420px]' }">
      <template #body>
        <div class="flex items-start gap-3">
          <UAvatar icon="i-lucide-trash-2" color="error" :ui="{ root: 'rounded-control ring ring-error/25' }" />

          <div class="flex min-w-0 flex-col gap-2">
            <p v-if="teamToDelete" class="text-row text-toned">
              You are about to delete the team
              <span class="font-medium text-highlighted">{{ teamToDelete.name }}</span>
            </p>
            <p class="text-meta text-muted">
              Only empty teams can be deleted.
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
          label="Delete team"
          color="error"
          :loading="deleting"
          @click="deleteTeam"
        />
      </template>
    </UModal>
  </div>
</template>
