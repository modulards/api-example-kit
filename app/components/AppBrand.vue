<template>
  <div class="flex min-w-0 flex-col">
    <div
      role="img"
      aria-label="Modular DS"
      class="h-8 w-[140px] shrink-0"
    >
      <img
        src="/modular-ds-logo-purple.png"
        alt=""
        aria-hidden="true"
        width="140"
        height="32"
        class="block h-8 w-[140px] object-contain dark:hidden"
      >
      <img
        src="/modular-ds-logo-white.png"
        alt=""
        aria-hidden="true"
        width="140"
        height="32"
        class="hidden h-8 w-[140px] object-contain dark:block"
      >
    </div>
    <!-- pl-10 and -mt-1 match where the wordmark sits inside the logo PNG. -->
    <span class="-mt-1 pl-10 text-xs text-muted">API Example Kit</span>
  </div>
</template>
