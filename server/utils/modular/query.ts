export type ApiQuery = Record<string, string | string[]>;

export interface ApiQueryInput {
  filter?: Record<string, string | readonly string[] | boolean | undefined>;
  sort?: string;
  page?: number;
  perPage?: number;
  include?: readonly string[];
  fields?: Record<string, readonly string[]>;
}

/** @see https://api.docs.modulards.com/modular-ds-public-api for the filter, sort, page, include and fields conventions. */
export function toQuery(input: ApiQueryInput): ApiQuery {
  const query: ApiQuery = {};

  for (const [name, value] of Object.entries(input.filter ?? {})) {
    if (value === undefined || value === '') {
      continue;
    }

    if (typeof value === 'boolean') {
      // `false` is a meaningful filter too, so it is never dropped.
      query[`filter[${name}]`] = value ? '1' : '0';
    } else if (typeof value === 'string') {
      query[`filter[${name}]`] = value;
    } else if (value.length > 0) {
      query[`filter[${name}][]`] = [...value];
    }
  }

  if (input.sort) {
    query.sort = input.sort;
  }

  if (input.page !== undefined) {
    query['page[number]'] = String(input.page);
  }

  if (input.perPage !== undefined) {
    query['page[size]'] = String(input.perPage);
  }

  if (input.include && input.include.length > 0) {
    query.include = input.include.join(',');
  }

  for (const [type, attrs] of Object.entries(input.fields ?? {})) {
    if (attrs.length > 0) {
      query[`fields[${type}]`] = attrs.join(',');
    }
  }

  return query;
}
