"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

/** Search box + filter slot above admin tables. Calls onSearch after typing stops. */
export function ListToolbar({
  search,
  onSearch,
  placeholder = "Search…",
  children,
}: {
  search?: string;
  onSearch?: (q: string) => void;
  placeholder?: string;
  children?: ReactNode;
}) {
  const [value, setValue] = useState(search ?? "");
  const debounced = useDebounce(value, 350);

  useEffect(() => {
    if (debounced !== (search ?? "")) onSearch?.(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      {onSearch && (
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="h-10 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm focus:border-foreground focus:outline-none"
          />
        </div>
      )}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Pill tabs used to filter by status: All · Pending · Shipped … */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | "";
  onChange: (value: T | "") => void;
  options: { value: T | ""; label: string; count?: number }[];
}) {
  return (
    <div className="scrollbar-none -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map((o) => (
        <button
          key={o.value || "all"}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
            value === o.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="text-xs opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
