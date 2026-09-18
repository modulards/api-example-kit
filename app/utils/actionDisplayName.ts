import type { SiteAction } from '#shared/types/modular';
import { sentenceCase } from '#shared/utils/text';

export function actionDisplayName(action: SiteAction): string {
  const managedItemNames = [...new Set(
    (action.managed_items ?? [])
      .map((item) => item.name?.trim())
      .filter((name): name is string => Boolean(name)),
  )];

  if (managedItemNames.length === 1) {
    return managedItemNames[0]!;
  }

  if (managedItemNames.length > 1) {
    return `${managedItemNames[0]} and ${managedItemNames.length - 1} more`;
  }

  return sentenceCase(action.type.replaceAll(/[._]/g, ' '));
}
