<script setup lang="ts">
useHead({ title: 'Settings' });

const saving = shallowRef(false);
const removing = shallowRef(false);

function onSaved(): void {
  // Discard all account data and polling state, not just the cached key metadata.
  window.location.reload();
}

async function onRemove(): Promise<void> {
  if (saving.value || removing.value) {
    return;
  }

  removing.value = true;

  try {
    await $fetch('/api/key', { method: 'DELETE', retry: 0 });
    window.location.replace('/setup');
  } catch (error) {
    notifyApiError(error);
    removing.value = false;
  }
}
</script>

<template>
  <AppNavbar title="Settings" />

  <div class="flex flex-col gap-5 px-4 py-6 sm:px-6">
    <UCard class="w-full max-w-3xl" :ui="{ body: 'flex flex-col gap-4' }">
      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-info"
        title="Manage your API key"
      >
        <template #description>
          <div class="flex flex-col gap-1">
            <p>
              A read-only key lets you explore the read views. Create, update, delete and Manager
              actions require a read-and-write key and change real resources in your Modular DS account.
            </p>
            <p>
              <a
                href="https://api.docs.modulards.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-primary underline underline-offset-2 hover:text-highlighted"
              >
                Read the Modular DS API docs
              </a>
            </p>
          </div>
        </template>
      </UAlert>
      <ApiKeyForm
        submit-label="Replace key"
        :disabled="removing"
        @busy="saving = $event"
        @saved="onSaved"
      />

      <template #footer>
        <UButton
          label="Remove key"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-trash-2"
          :loading="removing"
          :disabled="saving"
          @click="onRemove"
        />
      </template>
    </UCard>
  </div>
</template>
