"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Searchable multi-select of Bangladesh's districts.
 * `taken` maps a district to the name of another zone that already lists it.
 */
export function DistrictPicker({
  districts,
  value,
  onChange,
  taken = {},
}: {
  districts: string[];
  value: string[];
  onChange: (value: string[]) => void;
  taken?: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => districts.filter((d) => d.toLowerCase().includes(query.trim().toLowerCase())), [districts, query]);
  const toggle = (d: string) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort());

  return (
    <div className="rounded-md border border-input">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b p-2">
          {value.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 rounded-full bg-primary py-0.5 pr-1 pl-2.5 text-xs text-primary-foreground">
              {d}
              <button type="button" onClick={() => toggle(d)} className="rounded-full p-0.5 hover:bg-primary-foreground/20" aria-label={`Remove ${d}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${districts.length} districts…`}
          className="h-9 min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground" onClick={() => onChange([...new Set([...value, ...visible])].sort())}>
          Select shown
        </button>
        {value.length > 0 && (
          <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground" onClick={() => onChange([])}>
            Clear
          </button>
        )}
      </div>
      <div className="grid max-h-56 grid-cols-2 gap-x-2 overflow-y-auto p-2 sm:grid-cols-3">
        {visible.map((d) => {
          const checked = value.includes(d);
          return (
            <label key={d} className={cn("flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted", checked && "font-medium")}>
              <input type="checkbox" checked={checked} onChange={() => toggle(d)} className="size-4 accent-[var(--primary)]" />
              <span className="min-w-0">
                <span className="block truncate">{d}</span>
                {taken[d] && !checked && <span className="block truncate text-[10px] text-warning">in {taken[d]}</span>}
              </span>
            </label>
          );
        })}
        {visible.length === 0 && <p className="col-span-full px-2 py-4 text-center text-sm text-muted-foreground">No district matches “{query}”.</p>}
      </div>
    </div>
  );
}
