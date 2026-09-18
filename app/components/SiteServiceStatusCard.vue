<script setup lang="ts">
interface ServiceStatusResponse {
  service: SiteServiceStatus;
}

const props = defineProps<{
  siteId: string;
  isConnected?: boolean | null;
}>();

const submitting = shallowRef(false);
const requestedStatus = shallowRef<'active' | 'inactive' | null>(null);
const result = shallowRef<SiteServiceStatus | null>(null);

const isDisconnected = computed(() => props.isConnected === false);

async function requestStatus(status: 'active' | 'inactive'): Promise<void> {
  if (submitting.value || isDisconnected.value) {
    return;
  }

  submitting.value = true;
  requestedStatus.value = status;

  try {
    const response = await $fetch<ServiceStatusResponse>(`/api/sites/${props.siteId}/services/woocommerce/status`, {
      method: 'PATCH',
      body: { status },
    });

    result.value = response.service;
  } catch (e) {
    notifyApiError(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="min-w-0 truncate text-row font-semibold text-highlighted">WooCommerce service</h2>
    </template>

    <div class="flex flex-col gap-4">
      <p v-if="isDisconnected" class="text-meta text-muted">
        Connect the site before changing this service.
      </p>
      <p v-else-if="!result" class="text-meta text-muted">
        Request a status to see the response.
      </p>

      <div v-if="result" class="flex flex-col gap-1.5 text-meta">
        <div class="flex items-center gap-2">
          <span class="text-muted">Requested: {{ requestedStatus }}</span>
          <UBadge :color="result.service_status === 'active' ? 'success' : 'neutral'" variant="subtle">
            {{ result.service_status }}
          </UBadge>
        </div>
        <p class="text-dimmed">The API returned this status.</p>
      </div>

      <div class="flex flex-wrap gap-3">
        <UButton
          label="Activate WooCommerce service"
          color="primary"
          :loading="submitting && requestedStatus === 'active'"
          :disabled="submitting || isDisconnected"
          @click="requestStatus('active')"
        />
        <UButton
          label="Deactivate WooCommerce service"
          color="neutral"
          variant="outline"
          :loading="submitting && requestedStatus === 'inactive'"
          :disabled="submitting || isDisconnected"
          @click="requestStatus('inactive')"
        />
      </div>
    </div>
  </UCard>
</template>
