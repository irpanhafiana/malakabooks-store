import { Signal, computed, signal } from '@angular/core';

export interface ClientPagination<T> {
  /** Current 1-based page. */
  readonly page: Signal<number>;
  /** Total number of pages (>= 1). */
  readonly totalPages: Signal<number>;
  /** The slice of items for the current page. */
  readonly paged: Signal<T[]>;
  /** Total items across all pages. */
  readonly totalItems: Signal<number>;
  /** Jump to a page (clamped to valid range). */
  setPage(page: number): void;
}

/**
 * Reactive client-side pagination over a source signal.
 *
 * Pure helper (no DI) so any admin table can paginate a list without each
 * component re-implementing slicing/clamping. The page auto-clamps when the
 * source shrinks (e.g. after a filter or a delete) so the view never lands on
 * an empty out-of-range page.
 */
export function createClientPagination<T>(
  source: Signal<T[]>,
  pageSize = 10
): ClientPagination<T> {
  const page = signal(1);

  const totalItems = computed(() => source().length);

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalItems() / pageSize))
  );

  // Clamp the requested page against the current total.
  const safePage = computed(() => Math.min(page(), totalPages()));

  const paged = computed(() => {
    const start = (safePage() - 1) * pageSize;
    return source().slice(start, start + pageSize);
  });

  return {
    page: safePage,
    totalPages,
    paged,
    totalItems,
    setPage: (next: number) => page.set(Math.max(1, next))
  };
}
