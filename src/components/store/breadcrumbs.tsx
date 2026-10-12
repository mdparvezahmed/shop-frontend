import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

/** Visible breadcrumbs + BreadcrumbList structured data. The last item is the current page. */
export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="mb-4 overflow-x-auto text-xs text-muted-foreground scrollbar-none">
        <ol className="flex items-center gap-1.5 whitespace-nowrap">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          {items.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1.5">
              <ChevronRight className="size-3" />
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-foreground">{item.name}</span>
              ) : (
                <Link href={item.href} className="hover:text-foreground">{item.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
