export interface ResourceIdentifier { id: string; type: string }
export interface Relationship { data: ResourceIdentifier | ResourceIdentifier[] | null }

export interface ResourceObject<A = unknown> {
  id: string;
  type: string;
  attributes?: A;
  relationships?: Record<string, Relationship>;
  links?: { self?: string };
}

export type ApiErrorCode
  = | 'no_api_key'
    | 'invalid_api_key'
    | 'forbidden'
    | 'not_found'
    | 'modular_api'
    | 'modular_upstream'
    | 'transport';

export interface JsonApiErrorSource {
  parameter?: string;
  pointer?: string;
}

export interface JsonApiErrorObject {
  status?: string;
  title?: string;
  detail?: string;
  code?: string;
  source?: JsonApiErrorSource;
}

export interface JsonApiErrorDocument {
  errors?: JsonApiErrorObject[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CollectionDocument<A> {
  data: ResourceObject<A>[];
  included?: ResourceObject[];
  links?: { first?: string | null; last?: string | null; prev?: string | null; next?: string | null };
  meta?: PaginationMeta;
  jsonapi?: { version: string };
}
export interface SingleDocument<A> {
  data: ResourceObject<A>;
  included?: ResourceObject[];
  jsonapi?: { version: string };
}

/** A document with `meta` and no `data`. */
export interface MetaDocument<M> {
  meta?: Partial<M>;
  jsonapi?: { version: string };
}
