<script setup lang="ts">
import { connectionStatusLabel } from '#shared/constants/connection-status';

const props = defineProps<{
  site: Site;
}>();

const emit = defineEmits<{
  verified: [result: ConnectionVerification];
}>();

const manual = shallowRef<ManualConnection | null>(null);
const generating = shallowRef(false);
const revealUrl = computed(() => toAbsoluteHttpsUrl(manual.value?.reveal_url));

const verification = shallowRef<ConnectionVerification | null>(null);
const verifying = shallowRef(false);
let requestGeneration = 0;

async function generateManualLink(): Promise<void> {
  if (generating.value) {
    return;
  }

  const generation = requestGeneration;
  const siteId = props.site.id;
  generating.value = true;

  try {
    const result = await $fetch<ManualConnection>(`/api/sites/${siteId}/connection/manual`, { retry: 0 });

    if (generation === requestGeneration && siteId === props.site.id) {
      manual.value = result;
    }
  } catch (e) {
    if (generation === requestGeneration && siteId === props.site.id) {
      notifyApiError(e);
    }
  } finally {
    if (generation === requestGeneration) {
      generating.value = false;
    }
  }
}

async function verifyConnection(): Promise<void> {
  if (verifying.value) {
    return;
  }

  const generation = requestGeneration;
  const siteId = props.site.id;
  verifying.value = true;

  try {
    const result = await $fetch<ConnectionVerification>(`/api/sites/${siteId}/connection/verify`, {
      method: 'POST',
    });

    if (generation === requestGeneration && siteId === props.site.id) {
      verification.value = result;
      emit('verified', result);
    }
  } catch (e) {
    if (generation === requestGeneration && siteId === props.site.id) {
      notifyApiError(e);
    }
  } finally {
    if (generation === requestGeneration) {
      verifying.value = false;
    }
  }
}

watch(() => props.site.id, () => {
  requestGeneration += 1;
  manual.value = null;
  verification.value = null;
  generating.value = false;
  verifying.value = false;
});

onUnmounted(() => {
  requestGeneration += 1;
  manual.value = null;
  verification.value = null;
});
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">Connection</h2>
      <div class="grow" />
      <UBadge
        :color="site.is_connected ? 'success' : 'neutral'"
        variant="soft"
        :label="site.is_connected ? 'Connected' : 'Not connected'"
      />
    </template>

    <div class="flex flex-col gap-4">
      <p class="max-w-prose text-meta text-muted">
        Use one of these options to connect this site.
      </p>

      <div class="flex flex-col gap-2 border-t border-default pt-4">
        <p class="text-row font-medium text-highlighted">
          Manual connection
        </p>
        <p class="text-meta text-muted">
          Generate a one-time link for the connector.
        </p>

        <UButton
          label="Generate connection link"
          color="neutral"
          variant="outline"
          icon="i-lucide-key-round"
          :loading="generating"
          @click="generateManualLink"
        />

        <div v-if="manual" class="flex flex-col gap-2 text-meta">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-muted">Client ID</span>
            <span class="min-w-0 break-all font-mono text-mono text-toned">{{ manual.client_id }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-muted">Expires</span>
            <span class="text-toned">{{ formatDateTime(manual.expires_at) }}</span>
          </div>
          <UButton
            v-if="revealUrl"
            :to="revealUrl"
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            color="neutral"
            icon="i-lucide-external-link"
            label="Open credential link"
          />
          <p v-else class="text-muted">
            Link unavailable.
          </p>
          <p class="text-dimmed">
            Use the link once before it expires.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-2 border-t border-default pt-4">
        <p class="text-row font-medium text-highlighted">
          Verify connection
        </p>
        <p class="text-meta text-muted">
          Check the site now.
        </p>

        <div class="flex flex-col items-start gap-2">
          <UButton
            label="Verify connection"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="verifying"
            @click="verifyConnection"
          />
          <div v-if="verification" class="flex flex-wrap items-center gap-2">
            <UBadge
              :color="verification.is_connected ? 'success' : 'neutral'"
              variant="soft"
              :label="verification.is_connected ? 'Connected' : 'Not connected'"
            />
            <span class="text-meta text-dimmed">{{ connectionStatusLabel(verification.connection_status) }}</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
