"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ArrowRight, Search, X } from "lucide-react";
import { Price } from "@/components/ui/misc";
import { useDebounce } from "@/hooks/use-debounce";
import { catalogApi } from "@/services/shop";
import { useUi } from "@/stores/ui-store";

const POPULAR = ["Oversized tee", "Polo", "Graphic tee", "Hoodie", "Panjabi", "Joggers"];

/** Full-width search panel with instant results as you type. */
export function SearchOverlay() {
  const router = useRouter();
  const panel = useUi((s) => s.panel);
  const close = useUi((s) => s.close);
  const [q, setQ] = useState("");
  const query = useDebounce(q.trim(), 250);
  const inputRef = useRef<HTMLInputElement>(null);
  const open = panel === "search";

  const { data, isLoading } = useSWR(open && query.length >= 2 ? ["search", query] : null, () =>
    catalogApi.products({ q: query, limit: 6 }),
  );

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;

  const submit = (term: string) => {
    if (!term.trim()) return;
    close();
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 animate-fade-in bg-[var(--overlay)]" onClick={close} />
      <div className="relative animate-slide-up bg-background shadow-xl">
        <div className="container-page py-4">
          <form onSubmit={(e) => { e.preventDefault(); submit(q); }} className="flex items-center gap-3 border-b-2 border-foreground pb-2">
            <Search className="size-5 shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search t-shirts, polos, panjabi…"
              className="h-12 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              enterKeyHint="search"
            />
            <button type="button" onClick={close} className="rounded-full p-2 hover:bg-muted" aria-label="Close search">
              <X className="size-5" />
            </button>
          </form>

          <div className="max-h-[70vh] overflow-y-auto py-5">
            {query.length < 2 ? (
              <div>
                <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((term) => (
                    <button key={term} onClick={() => submit(term)} className="rounded-full border px-4 py-1.5 text-sm hover:bg-muted">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : isLoading ? (
              <p className="text-sm text-muted-foreground">Searching…</p>
            ) : data?.items.length ? (
              <div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.items.map((p) => (
                    <li key={p.id}>
                      <Link href={`/products/${p.slug}`} onClick={close} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image?.url} alt={p.image?.alt ?? p.name} className="h-20 w-16 shrink-0 rounded-md bg-muted object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <Price price={p.price} compareAtPrice={p.compareAtPrice} size="sm" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button onClick={() => submit(query)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:text-accent">
                  See all {data.meta.total} results <ArrowRight className="size-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No products found for “{query}”.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
