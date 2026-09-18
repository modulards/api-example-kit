import type { WritableComputedRef } from 'vue';

/**
 * Filters live in `route.query` so every view is linkable and back/forward works. Values are
 * always lists, like the API's `filter[name][]`: https://api.docs.modulards.com/modular-ds-public-api
 */
export function useListFilters<K extends string>(keys: readonly K[]) {
  const route = useRoute();
  const router = useRouter();

  function readList(key: string): string[] {
    const raw = route.query[key];

    if (raw === undefined) {
      return [];
    }

    const items = Array.isArray(raw) ? raw : [raw];
    return items.filter((item): item is string => item != null);
  }

  function filter(key: K): WritableComputedRef<string[]> {
    return computed({
      get: () => readList(key),
      // A narrower list may not reach the current page. `undefined` drops the key from the URL.
      set: (values) => {
        router.replace({ query: { ...route.query, [key]: values.length ? values : undefined, page: undefined } });
      },
    });
  }

  const page = computed<number>({
    get: () => {
      const value = Number(route.query.page);
      return Number.isInteger(value) && value > 0 ? value : 1;
    },
    set: (value) => {
      router.replace({ query: { ...route.query, page: value > 1 ? String(value) : undefined } });
    },
  });

  function reset(): void {
    router.replace({ query: {} });
  }

  const activeCount = computed(() => keys.reduce((count, key) => count + readList(key).length, 0));

  const query = computed(() => {
    const result: Record<string, string | string[]> = { page: String(page.value) };

    for (const key of keys) {
      const values = readList(key);

      if (values.length) {
        result[key] = values;
      }
    }

    return result;
  });

  return { filter, page, query, reset, activeCount };
}
