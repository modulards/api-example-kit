import type { AppMeta } from '#shared/types/api-keys';

export default defineEventHandler(async (event): Promise<AppMeta> => {
  const token = await readApiKeyToken(event);

  return { hasKey: token !== null };
});
