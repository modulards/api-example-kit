<script setup lang="ts">
interface TeamOption {
  label: string;
  value: number;
}

const props = defineProps<{
  modelValue: number | null;
  disabled?: boolean;
  initialLabel?: { id: number; name: string } | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [id: number | null];
}>();

const searchTerm = ref('');
const currentPage = ref(1);
const menuOpen = shallowRef(false);

const query = computed(() => ({
  q: searchTerm.value || undefined,
  page: currentPage.value > 1 ? currentPage.value : undefined,
}));

const { data, status, error, refresh } = useFetch('/api/teams', {
  query,
  immediate: false,
  watch: false,
  retry: 0,
});
watch(menuOpen, (open) => {
  if (open) {
    void refresh();
  }
}, { immediate: true });

const items = computed(() => data.value?.items ?? []);
const meta = computed(() => data.value?.meta);
const knownLabels = shallowRef(new Map<number, string>());

watch([items, () => props.initialLabel], ([teams, initial]) => {
  const labels = new Map(knownLabels.value);

  if (initial) {
    labels.set(Number(initial.id), initial.name);
  }

  for (const team of teams) {
    labels.set(Number(team.id), team.name);
  }

  knownLabels.value = labels;
}, { immediate: true });

const options = computed<TeamOption[]>(() => {
  const pageOptions = items.value.map((team) => ({
    label: team.name,
    value: Number(team.id),
  }));

  if (props.modelValue != null && !pageOptions.some((option) => option.value === props.modelValue)) {
    pageOptions.unshift({
      label: knownLabels.value.get(props.modelValue) ?? `Team ${props.modelValue}`,
      value: props.modelValue,
    });
  }

  return pageOptions;
});

const selected = computed({
  get: () => props.modelValue ?? undefined,
  set: (id: number | undefined) => {
    emit('update:modelValue', id ?? null);
  },
});

watch(searchTerm, async () => {
  currentPage.value = 1;

  if (menuOpen.value) {
    await nextTick();
    await refresh();
  }
});

async function goPrevious(): Promise<void> {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
    await nextTick();
    await refresh();
  }
}

async function goNext(): Promise<void> {
  if (meta.value && currentPage.value < meta.value.lastPage) {
    currentPage.value += 1;
    await nextTick();
    await refresh();
  }
}

async function retry(): Promise<void> {
  await refresh();
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <USelectMenu
      v-model:open="menuOpen"
      v-model="selected"
      v-model:search-term="searchTerm"
      :items="options"
      :multiple="false"
      value-key="value"
      ignore-filter
      :loading="status === 'pending'"
      :disabled="disabled || !!error"
      searchable
      placeholder="Select a team"
    >
      <template #leading>
        <UIcon name="i-lucide-users" class="size-4 text-dimmed" />
      </template>
    </USelectMenu>

    <div v-if="error" class="flex items-center justify-between gap-2 text-meta text-error">
      <span>Could not load teams.</span>
      <UButton
        label="Retry"
        color="neutral"
        variant="ghost"
        size="sm"
        :loading-auto="true"
        @click="retry"
      />
    </div>

    <div
      v-if="meta && (meta.currentPage > 1 || meta.lastPage > 1)"
      class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 sm:gap-2"
    >
      <UButton
        label="Previous"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="meta.currentPage <= 1"
        @click="goPrevious"
      />
      <span class="min-w-0 text-center font-mono text-mono-sm text-dimmed">Page {{ meta.currentPage }} of {{ meta.lastPage }}</span>
      <UButton
        label="Next"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="meta.currentPage >= meta.lastPage"
        @click="goNext"
      />
    </div>
  </div>
</template>
