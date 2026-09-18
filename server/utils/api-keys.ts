import type { H3Event } from 'h3';

export async function readApiKeyToken(event: H3Event): Promise<string | null> {
  const session = await getUserSession(event);
  return session.secure?.apiKey ?? null;
}
