"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Checkbox } from "@/components/ui/form";
import { EmptyState, Pagination, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/types";

/**
 * Generic admin table.
 *
 *   <DataTable
 *     rows={data?.items}
 *     loading={isLoading}
 *     columns={[{ key: "name", header: "Name", cell: (row) => row.name }]}
 *     meta={data?.meta}
 *     onPageChange={setPage}
 *   />
 *
 * Scrolls horizontally on small screens; `hideOnMobile` columns are dropped below `sm`.
 */
export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  align?: "left" | "right" | "center";
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading,
  meta,
  onPageChange,
  onRowClick,
  selectable,
  selected = [],
  onSelectedChange,
  empty,
}: {
  rows?: T[];
  columns: Column<T>[];
  loading?: boolean;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  empty?: { title: string; description?: ReactNode; action?: ReactNode };
}) {
  const allSelected = !!rows?.length && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => onSelectedChange?.(allSelected ? [] : (rows ?? []).map((r) => r.id));
  const toggle = (id: string) => onSelectedChange?.(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const alignClass = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 font-medium whitespace-nowrap", alignClass(c.align), c.hideOnMobile && "hidden md:table-cell", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && !rows
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {selectable && <td className="px-4 py-3" />}
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3", c.hideOnMobile && "hidden md:table-cell")}>
                        <Skeleton className="h-4 w-full max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn("transition", onRowClick && "cursor-pointer hover:bg-muted/50", selected.includes(row.id) && "bg-muted/40")}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(row.id)} onChange={() => toggle(row.id)} aria-label="Select row" />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle", alignClass(c.align), c.hideOnMobile && "hidden md:table-cell", c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && rows && rows.length === 0 && (
        <EmptyState icon={<Inbox className="size-6" />} title={empty?.title ?? "Nothing here yet"} description={empty?.description} action={empty?.action} />
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
