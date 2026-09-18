export default defineNuxtRouteMiddleware(async (to) => {
  const { data: meta, error } = await useFetch('/api/meta', { key: 'app-meta', retry: 0 });

  if (error.value) {
    throw createError(error.value);
  }

  if (!meta.value?.hasKey && to.name !== 'setup') {
    return navigateTo(
      { path: '/setup', query: { redirect: to.fullPath } },
      { replace: true },
    );
  }

  if (meta.value?.hasKey && to.name === 'setup') {
    const redirect = to.query.redirect;
    let destination = '/sites';

    if (
      typeof redirect === 'string'
      && redirect.startsWith('/')
      && !redirect.startsWith('//')
      && !redirect.includes('\\')
    ) {
      try {
        const parsed = new URL(redirect, 'http://internal');
        const pathname = decodeURIComponent(parsed.pathname);
        const isSafeRedirect = parsed.origin === 'http://internal'
          && !pathname.startsWith('//')
          && !pathname.includes('\\')
          && pathname.toLowerCase().replace(/\/+$/, '') !== '/setup';

        if (isSafeRedirect) {
          destination = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        // A malformed redirect falls back to the sites list.
      }
    }

    return navigateTo(destination, { replace: true });
  }
});
