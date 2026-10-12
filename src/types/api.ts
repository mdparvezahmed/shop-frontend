/** Response envelope used by every backend endpoint. */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiSuccess<T> = { success: true; data: T; meta?: PaginationMeta };
export type ApiFailure = {
  success: false;
  error: { message: string; code?: string; details?: unknown };
};

export type Paginated<T> = { items: T[]; meta: PaginationMeta };
