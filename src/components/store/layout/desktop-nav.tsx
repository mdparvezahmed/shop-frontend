import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { NavItem } from "@/types";

/**
 * Desktop navigation — its own row under the logo bar.
 *
 * Menus are created by the admin, so their number and length are unknown:
 * the row wraps to a second line instead of overlapping when there are many.
 * Dropdowns are full-width panels under the row (positioned against the
 * <nav>, not the menu item), so they never run off the edge of the screen.
 *
 * Pure CSS hover/focus — every link is in the server-rendered HTML and crawlable.
 */
export function DesktopNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="relative hidden border-t lg:block" aria-label="Main">
      <ul className="container-page flex flex-wrap items-center justify-center gap-x-1">
        {items.map((item) => (
          <li key={item.id} className="group">
            <Link
              href={item.href}
              className="inline-flex items-center gap-1 px-2 py-3.5 text-xs font-medium tracking-wide xl:px-3 xl:text-[13px] xl:tracking-wider whitespace-nowrap uppercase transition hover:text-accent group-focus-within:text-accent group-hover:text-accent"
            >
              {item.name}
              {item.children.length > 0 && <ChevronDown className="size-3.5 transition group-hover:rotate-180" />}
            </Link>
            {item.children.length > 0 && <DropdownPanel item={item} />}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DropdownPanel({ item }: { item: NavItem }) {
  // Sub-menus that have their own children become columns with a heading.
  const grouped = item.children.some((c) => c.children.length > 0);

  return (
    <div className="invisible absolute inset-x-0 top-full z-50 border-y bg-card opacity-0 shadow-xl transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
      <div className="container-page flex gap-10 py-8">
        <div className="min-w-0 flex-1">
          <p className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{item.name}</p>
          {grouped ? (
            <div className="grid max-w-4xl grid-cols-3 gap-8 xl:grid-cols-4">
              {item.children.map((child) => (
                <div key={child.id}>
                  <Link href={child.href} className="text-sm font-semibold hover:text-accent">{child.name}</Link>
                  <ul className="mt-2.5 space-y-2">
                    {child.children.map((g) => (
                      <li key={g.id}>
                        <Link href={g.href} className="text-sm text-muted-foreground hover:text-foreground">{g.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <ul className="grid max-w-2xl grid-cols-2 gap-x-6 gap-y-1 xl:grid-cols-3">
              {item.children.map((child) => (
                <li key={child.id}>
                  <Link href={child.href} className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={item.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
            Shop all {item.name} <ArrowRight className="size-4" />
          </Link>
        </div>
        {item.image && (
          <Link href={item.href} className="w-56 shrink-0 overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.name} className="aspect-square w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
          </Link>
        )}
      </div>
    </div>
  );
}
