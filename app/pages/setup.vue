<script setup lang="ts">
definePageMeta({ layout: false });
useHead({ title: 'Connect' });

function onSaved(): void {
  // Reload to start fresh; the route guard resumes the requested destination.
  window.location.reload();
}
</script>

<template>
  <main class="relative flex min-h-screen flex-col overflow-hidden bg-default text-default">
    <header class="relative flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
      <AppBrand />

      <UColorModeButton size="sm" square color="neutral" variant="ghost" />
    </header>

    <div class="relative flex flex-1 items-start justify-center px-5 pb-12 pt-8 sm:items-center sm:px-8 sm:pb-20 sm:pt-4">
      <section class="w-full max-w-md">
        <div class="mb-7 text-center sm:mb-8">
          <h1 class="text-3xl font-semibold text-highlighted sm:text-4xl">Connect to Modular DS</h1>
          <p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted sm:text-base">
            Add an API key to explore your account and websites with Modular DS API Example Kit.
          </p>
        </div>

        <UCard :ui="{ body: 'p-5 sm:p-6', root: 'shadow-lg ring-default' }">
          <div class="mb-6 space-y-3 text-sm leading-6 text-muted">
            <p>
              Sign in to Modular DS, open Settings, choose API, then select <span class="font-medium text-default">Create key</span>.
              A read-only key lets you explore the read views. Choose <span class="font-medium text-default">Read and write</span> to try write actions.
            </p>
            <p>
              Create, update, delete and Manager actions change real resources in your Modular DS account.
            </p>
            <p>
              <a
                href="https://api.docs.modulards.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-primary underline underline-offset-2 hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Read the Modular DS API docs
                <UIcon name="i-lucide-arrow-up-right" class="ml-1 inline-block size-3.5" aria-hidden="true" />
              </a>
            </p>
          </div>

          <ApiKeyForm submit-label="Connect to Modular DS" @saved="onSaved" />
        </UCard>
      </section>
    </div>
  </main>
</template>
