"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Select } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlay";
import { cn, formatPrice } from "@/lib/utils";
import type { Facets } from "@/types";
import { SORT_OPTIONS } from "./params";

/** Reads/writes filters in the URL. Changing a filter resets to page 1. */
function useFilterUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page");
    const s = next.toString();
    startTransition(() => router.push(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };

  const values = (key: string) => params.getAll(key).flatMap((v) => v.split(",")).filter(Boolean);

  const toggle = (key: string, value: string) =>
    update((p) => {
      const current = values(key);
      p.delete(key);
      (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]).forEach((v) => p.append(key, v));
    });

  const set = (key: string, value: string | null) => update((p) => (value ? p.set(key, value) : p.delete(key)));

  return { params, values, toggle, set, update, pending };
}

function FilterPanel({ facets }: { facets: Facets }) {
  const { params, values, toggle, set, update } = useFilterUrl();
  const [min, setMin] = useState(params.get("minPrice") ?? "");
  const [max, setMax] = useState(params.get("maxPrice") ?? "");

  useEffect(() => {
    setMin(params.get("minPrice") ?? "");
    setMax(params.get("maxPrice") ?? "");
  }, [params]);

  const sizes = values("size");
  const colors = values("color");

  return (
    <div className="space-y-7">
      {facets.sizes.length > 0 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <button
                key={s}
                onClick={() => toggle("size", s)}
                className={cn("h-9 min-w-11 rounded-md border px-3 text-sm transition", sizes.includes(s) ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground")}
                aria-pressed={sizes.includes(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {facets.colors.length > 0 && (
        <FilterGroup title="Colour">
          <div className="grid grid-cols-2 gap-2">
            {facets.colors.map((c) => {
              const active = colors.includes(c.name);
              return (
                <button key={c.name} onClick={() => toggle("color", c.name)} className="flex items-center gap-2 rounded-md py-1 text-left text-sm" aria-pressed={active}>
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border", active && "ring-2 ring-foreground ring-offset-2 ring-offset-background")} style={{ backgroundColor: c.hex }}>
                    {active && <Check className={cn("size-3.5", isLight(c.hex) ? "text-black" : "text-white")} />}
                  </span>
                  <span className={cn(active ? "font-medium" : "text-muted-foreground")}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update((p) => {
              min ? p.set("minPrice", min) : p.delete("minPrice");
              max ? p.set("maxPrice", max) : p.delete("maxPrice");
            });
          }}
        >
          <input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={`৳${facets.price.min}`} className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm" aria-label="Minimum price" />
          <span className="text-muted-foreground">–</span>
          <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={`৳${facets.price.max}`} className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm" aria-label="Maximum price" />
          <Button type="submit" size="sm" variant="outline" className="h-9">Go</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatPrice(facets.price.min)} – {formatPrice(facets.price.max)}
        </p>
      </FilterGroup>

      <FilterGroup title="Availability">
        <div className="space-y-2.5">
          <Checkbox label="In stock only" checked={params.get("inStock") === "true"} onChange={(e) => set("inStock", e.target.checked ? "true" : null)} />
          <Checkbox label="On sale" checked={params.get("onSale") === "true"} onChange={(e) => set("onSale", e.target.checked ? "true" : null)} />
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-sans text-xs font-semibold tracking-widest uppercase">{title}</h3>
      {children}
    </div>
  );
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170;
}

/** Desktop sidebar. */
export function FilterSidebar({ facets }: { facets: Facets }) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-24">
        <FilterPanel facets={facets} />
      </div>
    </aside>
  );
}

/** Count + mobile filter button + sort + active filter chips. */
export function ListingToolbar({ facets, total }: { facets: Facets; total: number }) {
  const { params, values, toggle, set, update, pending } = useFilterUrl();
  const [open, setOpen] = useState(false);

  const chips: { label: string; remove: () => void }[] = [
    ...values("size").map((s) => ({ label: `Size ${s}`, remove: () => toggle("size", s) })),
    ...values("color").map((c) => ({ label: c, remove: () => toggle("color", c) })),
    ...(params.get("minPrice") || params.get("maxPrice")
      ? [{ label: `${params.get("minPrice") ? formatPrice(Number(params.get("minPrice"))) : "৳0"} – ${params.get("maxPrice") ? formatPrice(Number(params.get("maxPrice"))) : "any"}`, remove: () => update((p) => { p.delete("minPrice"); p.delete("maxPrice"); }) }]
      : []),
    ...(params.get("inStock") ? [{ label: "In stock", remove: () => set("inStock", null) }] : []),
    ...(params.get("onSale") ? [{ label: "On sale", remove: () => set("onSale", null) }] : []),
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="lg:hidden" onClick={() => setOpen(true)}>
            <SlidersHorizontal className="size-4" /> Filter{chips.length ? ` (${chips.length})` : ""}
          </Button>
          <p className={cn("hidden text-sm text-muted-foreground sm:block", pending && "opacity-50")}>{total} products</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="hidden text-sm text-muted-foreground sm:block">Sort by</label>
          <Select id="sort" value={params.get("sort") ?? "newest"} onChange={(e) => set("sort", e.target.value === "newest" ? null : e.target.value)} className="w-48">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.remove} className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs hover:border-foreground">
              {c.label} <X className="size-3" />
            </button>
          ))}
          <button
            onClick={() => update((p) => ["size", "color", "minPrice", "maxPrice", "inStock", "onSale"].forEach((k) => p.delete(k)))}
            className="text-xs font-medium underline underline-offset-4"
          >
            Clear all
          </button>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} side="left" title="Filters" footer={<Button className="w-full" size="lg" onClick={() => setOpen(false)}>Show {total} products</Button>}>
        <div className="p-5">
          <FilterPanel facets={facets} />
        </div>
      </Sheet>
    </div>
  );
}
