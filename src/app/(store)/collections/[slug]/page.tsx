import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { ProductListing } from "@/components/store/listing/product-listing";
import { hasFilters, parseListingParams, type SearchParams } from "@/components/store/listing/params";
import { JsonLd } from "@/components/shared/json-ld";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { plainText } from "@/lib/utils";
import { getCollection, getFacets, getProducts } from "@/services/storefront.server";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getCollection(slug);
  if (!menu) return { title: "Collection not found" };
  const query = parseListingParams(await searchParams);
  const page = query.page && query.page > 1 ? ` – Page ${query.page}` : "";
  return pageMetadata({
    title: `${menu.seoTitle || menu.name}${page}`,
    description: menu.seoDescription || plainText(menu.description) || `Shop ${menu.name} online in Bangladesh with cash on delivery.`,
    path: `/collections/${slug}${query.page && query.page > 1 ? `?page=${query.page}` : ""}`,
    image: menu.bannerImage || menu.image,
    // Filtered/sorted variations are not separate pages for Google.
    noIndex: hasFilters(query),
  });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const menu = await getCollection(slug);
  if (!menu) notFound();
  if (menu.type === "LINK" && menu.href.startsWith("/") && !menu.href.startsWith("/collections/")) redirect(menu.href);

  const query = parseListingParams(sp);
  const [{ items, meta }, facets] = await Promise.all([getProducts({ ...query, menu: slug }), getFacets(slug)]);
  const crumbs = [...menu.breadcrumbs.map((b) => ({ name: b.name, href: b.href })), { name: menu.name, href: `/collections/${slug}` }];

  return (
    <>
      <JsonLd data={itemListJsonLd(items)} />
      <ProductListing
        products={items}
        meta={meta}
        facets={facets}
        basePath={`/collections/${slug}`}
        searchParams={sp}
        header={
          <div className="mb-8">
            <Breadcrumbs items={crumbs} />
            <h1 className="text-3xl font-semibold tracking-wide uppercase sm:text-4xl">{menu.name}</h1>
            {menu.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{plainText(menu.description, 200)}</p>}
            {menu.children.length > 0 && (
              <div className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {menu.children.map((c) => (
                  <Link key={c.id} href={c.href} className="shrink-0 rounded-full border px-4 py-2 text-sm transition hover:border-foreground hover:bg-muted">
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        }
        footer={
          menu.description && plainText(menu.description).length > 200 ? (
            <section className="rich-text mt-16 border-t pt-10 text-sm" dangerouslySetInnerHTML={{ __html: menu.description }} />
          ) : null
        }
      />
    </>
  );
}
