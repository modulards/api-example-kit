export default defineNitroPlugin(() => {
  if (import.meta.dev) {
    return;
  }

  const password = useRuntimeConfig().session.password;

  if (typeof password !== 'string' || password.trim().length < 32) {
    throw new Error('NUXT_SESSION_PASSWORD must contain at least 32 non-padding characters in production.');
  }
});
