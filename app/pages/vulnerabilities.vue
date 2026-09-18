<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { SiteVulnerability } from '#shared/types/modular';
import type { VulnerabilityComponentType, VulnerabilitySeverity } from '#shared/constants/vulnerabilities';
import { VULNERABILITY_COMPONENT_TYPES, VULNERABILITY_SEVERITIES } from '#shared/constants/vulnerabilities';

useHead({ title: 'Vulnerabilities' });

const SEVERITY_LABEL: Record<VulnerabilitySeverity, string> = {
  c: 'Critical',
  h: 'High',
  m: 'Medium',
  l: 'Low',
  n: 'None',
  null: 'Unknown',
};

function vulnerabilitySeverityLabel(severity: string | null): string {
  if (severity === null) {
    return 'Unknown';
  }

  return SEVERITY_LABEL[severity as VulnerabilitySeverity] ?? severity;
}

type VulnerabilitySeverityTone = 'error' | 'warning' | 'info' | 'neutral';

const SEVERITY_TONE: Record<VulnerabilitySeverity, VulnerabilitySeverityTone> = {
  c: 'error',
  h: 'error',
  m: 'warning',
  l: 'info',
  n: 'neutral',
  null: 'neutral',
};

function vulnerabilitySeverityTone(severity: string | null): VulnerabilitySeverityTone {
  if (severity === null) {
    return 'neutral';
  }

  return SEVERITY_TONE[severity as VulnerabilitySeverity] ?? 'neutral';
}

const COMPONENT_TYPE_LABEL: Record<VulnerabilityComponentType, string> = {
  core: 'Core',
  plugin: 'Plugin',
  theme: 'Theme',
  php: 'PHP',
  mariadb: 'MariaDB',
  mysql: 'MySQL',
};

function vulnerabilityComponentTypeLabel(type: string | null): string {
  if (type === null) {
    return 'No type';
  }

  return COMPONENT_TYPE_LABEL[type as VulnerabilityComponentType] ?? type;
}

function vulnerabilityFixStatusLabel(unfixed: boolean): string {
  return unfixed ? 'Unfixed' : 'Fixed';
}

function vulnerabilityFixStatusTone(unfixed: boolean): 'warning' | 'success' {
  return unfixed ? 'warning' : 'success';
}

// Widened to `string`: the filters are URL-derived, not narrowed enums.
const severityOptions: { label: string; value: string }[] = VULNERABILITY_SEVERITIES
  .map((value) => ({ label: vulnerabilitySeverityLabel(value), value }));
const componentTypeOptions: { label: string; value: string }[] = VULNERABILITY_COMPONENT_TYPES
  .map((value) => ({ label: vulnerabilityComponentTypeLabel(value), value }));

const { filter, page, query, reset, activeCount } = useListFilters(['severity', 'componentType']);
const severityFilter = filter('severity');
const componentTypeFilter = filter('componentType');

const { data, error, status, refresh } = useFetch('/api/vulnerabilities', {
  query,
  retry: 0,
});

const isLoading = computed(() => status.value === 'pending');
const vulnerabilities = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const totalLabel = computed(() => (total.value === 1 ? '1 vulnerability' : `${total.value} vulnerabilities`));

const columns: TableColumn<SiteVulnerability>[] = [
  { id: 'severity', header: 'Severity', meta: { class: { th: 'w-[140px]', td: 'w-[140px]' } } },
  { id: 'score', header: 'Score', meta: { class: { th: 'w-[120px]', td: 'w-[120px]' } } },
  { id: 'unfixed', header: 'Fix status', meta: { class: { th: 'w-[130px]', td: 'w-[130px]' } } },
  { id: 'name', header: 'Vulnerability', meta: { class: { th: 'min-w-[280px]', td: 'min-w-[280px] max-w-[380px]' } } },
  { id: 'site', header: 'Site', meta: { class: { th: 'w-[200px]', td: 'w-[200px] max-w-[200px]' } } },
  { id: 'component', header: 'Component', meta: { class: { th: 'w-[220px]', td: 'w-[220px] max-w-[220px]' } } },
  { id: 'affected_version_range', header: 'Affected version', meta: { class: { th: 'w-[170px]', td: 'w-[170px] max-w-[170px]' } } },
  { id: 'discovered_at', header: 'Discovered', meta: { class: { th: 'w-[140px] text-end', td: 'w-[140px] text-end' } } },
];

function openSite(_event: Event, row: { original: SiteVulnerability }): void {
  navigateTo(`/sites/${row.original.site.id}`);
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <AppNavbar title="Vulnerabilities">
      <template #trailing>
        <span v-if="data" class="hidden font-mono text-mono-sm text-dimmed sm:inline">{{ totalLabel }}</span>
      </template>
    </AppNavbar>

    <UDashboardToolbar>
      <template #left>
        <USelectMenu
          v-model="severityFilter"
          :items="severityOptions"
          value-key="value"
          :multiple="true"
          icon="i-lucide-shield-alert"
          placeholder="Severity"
          aria-label="Filter by severity"
          class="w-full sm:w-52"
        />
        <USelectMenu
          v-model="componentTypeFilter"
          :items="componentTypeOptions"
          value-key="value"
          :multiple="true"
          icon="i-lucide-puzzle"
          placeholder="Component"
          aria-label="Filter by component type"
          class="w-full sm:w-52"
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

    <AppErrorState v-if="error" :error="error" size="lg" class="grow" :retry="refresh" />

    <template v-else>
      <div class="grow">
        <UTable
          :data="vulnerabilities"
          :columns="columns"
          :loading="isLoading"
          loading-color="primary"
          loading-animation="carousel"
          :on-select="openSite"
          :ui="{ th: 'px-4 sm:px-6', td: 'px-4 py-2.5 sm:px-6' }"
        >
          <template #severity-cell="{ row }">
            <UBadge
              :color="vulnerabilitySeverityTone(row.original.severity)"
              variant="subtle"
              :label="vulnerabilitySeverityLabel(row.original.severity)"
            />
          </template>
          <template #score-cell="{ row }">
            <span class="block truncate font-mono text-mono-sm text-muted" :title="row.original.score ?? ''">
              {{ row.original.score ?? '—' }}
            </span>
          </template>

          <template #unfixed-cell="{ row }">
            <UBadge
              :color="vulnerabilityFixStatusTone(row.original.unfixed)"
              variant="subtle"
              :label="vulnerabilityFixStatusLabel(row.original.unfixed)"
            />
          </template>

          <template #name-cell="{ row }">
            <div class="flex min-w-0 flex-col leading-tight">
              <span class="truncate text-row font-medium text-highlighted" :title="row.original.name">{{ row.original.name }}</span>
              <span v-if="row.original.description" class="truncate text-meta text-muted" :title="row.original.description">
                {{ row.original.description }}
              </span>
            </div>
          </template>

          <template #site-cell="{ row }">
            <span class="block truncate text-row text-highlighted" :title="row.original.site.name">{{ row.original.site.name }}</span>
          </template>

          <template #component-cell="{ row }">
            <div class="flex min-w-0 flex-col leading-tight">
              <span class="truncate text-row text-toned" :title="row.original.component.name">{{ row.original.component.name }}</span>
              <span class="truncate text-eyebrow uppercase text-muted">{{ vulnerabilityComponentTypeLabel(row.original.component.type) }}</span>
            </div>
          </template>

          <template #affected_version_range-cell="{ row }">
            <span class="block truncate font-mono text-mono-sm text-muted" :title="row.original.affected_version_range ?? ''">
              {{ row.original.affected_version_range ?? '—' }}
            </span>
          </template>

          <template #discovered_at-cell="{ row }">
            <span class="text-meta text-muted">{{ formatShortDate(row.original.discovered_at) }}</span>
          </template>

          <template #empty>
            <UEmpty
              v-if="activeCount > 0"
              icon="i-lucide-search-x"
              title="No vulnerability matches these filters"
              description="Try removing one of the active filters."
              size="md"
            >
              <template #actions>
                <UButton color="neutral" variant="subtle" icon="i-lucide-x" label="Clear filters" @click="reset" />
              </template>
            </UEmpty>
            <UEmpty
              v-else
              icon="i-lucide-shield-check"
              title="No known vulnerabilities"
              description="No site in the account has any vulnerability detected right now."
              size="lg"
            />
          </template>
        </UTable>
      </div>

      <AppPaginationFooter
        v-if="data && total > 0"
        v-model:page="page"
        :total="total"
        :per-page="data.meta.perPage"
        variant="page"
      />
    </template>
  </div>
</template>
