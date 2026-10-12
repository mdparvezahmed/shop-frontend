"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { AdminMenu } from "@/types/admin-catalog";
import { flattenMenus, menuLabel } from "./menu-tree";

/**
 * Multi-select checkbox tree of every menu. A product can live in many
 * menus/sub-menus at once (e.g. "T-Shirts › Graphic Tees" and "Summer Sale").
 * Selected menus are shown as removable chips above the tree.
 */
export function MenuPicker({
  menus,
  value,
  onChange,
  loading,
  error,
}: {
  menus: AdminMenu[] | undefined;
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const flat = useMemo(() => flattenMenus(menus), [menus]);
  const visible = query ? flat.filter((f) => menuLabel(f).toLowerCase().includes(query.toLowerCase())) : flat;
  const selected = flat.filter((f) => value.includes(f.menu.id));

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  if (loading) return <Skeleton className="h-40 w-full" />;

  if (!flat.length) {
    return (
      <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No menus yet.{" "}
        <Link href="/admin/menus" className="font-medium text-foreground underline">
          Create a menu
        </Link>{" "}
        first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex min-h-8 flex-wrap gap-1.5">
        {selected.length ? (
          selected.map((f) => (
            <span key={f.menu.id} className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground">
              {menuLabel(f)}
              <button type="button" onClick={() => toggle(f.menu.id)} aria-label={`Remove ${f.menu.name}`} className="opacity-70 hover:opacity-100">
                <X className="size-3" />
              </button>
            </span>
          ))
        ) : (
          <span className={cn("text-sm", error ? "text-sale" : "text-muted-foreground")}>No menu selected — pick at least one below.</span>
        )}
      </div>

      <div className={cn("overflow-hidden rounded-md border", error && "border-sale")}>
        {flat.length > 8 && (
          <div className="relative border-b">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              placeholder="Filter menus…"
              className="h-9 w-full bg-transparent pr-3 pl-9 text-sm focus:outline-none"
            />
          </div>
        )}
        <ul className="max-h-72 divide-y overflow-y-auto">
          {visible.map((f) => (
            <li key={f.menu.id} className="hover:bg-muted/50">
              <Checkbox
                checked={value.includes(f.menu.id)}
                onChange={() => toggle(f.menu.id)}
                className="flex w-full px-3 py-2"
                label={
                  <span className="flex min-w-0 flex-1 items-center gap-2" style={{ paddingLeft: query ? 0 : f.depth * 18 }}>
                    <span className={cn("truncate", f.depth === 0 && "font-medium")}>{query ? menuLabel(f) : f.menu.name}</span>
                    {f.menu.type === "LINK" && <span className="text-xs text-muted-foreground">(link)</span>}
                    {!f.menu.isActive && <span className="text-xs text-muted-foreground">(hidden)</span>}
                  </span>
                }
              />
            </li>
          ))}
          {!visible.length && <li className="px-3 py-4 text-center text-sm text-muted-foreground">No menu matches “{query}”.</li>}
        </ul>
      </div>
      {error && <p className="text-xs text-sale">{error}</p>}
    </div>
  );
}
