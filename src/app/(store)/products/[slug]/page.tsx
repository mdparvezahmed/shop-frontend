import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCcw, ShieldCheck, Truck, Wallet } from "lucide-react";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { ProductSection } from "@/components/store/home/sections";
import { ProductReviews } from "@/components/store/product/product-reviews";
import { ProductView } from "@/components/store/product/product-view";
import { SizeChartTable } from "@/components/store/product/size-chart-modal";
import { JsonLd } from "@/components/shared/json-ld";
import { pageMetadata, productJsonLd } from "@/lib/seo";
import { formatPrice, plainText } from "@/lib/utils";
import { getLayout, getProduct, getRelated, getShippingInfo } from "@/services/storefront.server";
import type { ShippingInfo } from "@/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    ...pageMetadata({
      title: product.seo.title || product.name,
      description: product.seo.description || plainText(product.shortDescription || product.description, 160),
      path: `/products/${product.slug}`,
      image: product.seo.ogImage || product.images[0]?.url,
      keywords: product.seo.keywords,
    }),
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": "BDT",
      "product:availability": product.inStock ? "in stock" : "out of stock",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [related, layout, shipping] = await Promise.all([getRelated(slug), getLayout(), getShippingInfo().catch(() => null)]);
  const crumbs = [...product.breadcrumbs.map((b) => ({ name: b.name, href: b.href })), { name: product.name, href: `/products/${product.slug}` }];

  return (
    <>
      <JsonLd data={productJsonLd(product, layout.store.name)} />
      <div className="container-page py-4 sm:py-8">
        <Breadcrumbs items={crumbs} />
        <ProductView product={product} deliveryNote={<DeliveryNote shipping={shipping} freeOver={layout.checkout.freeShippingThreshold} />} />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div className="space-y-2">
            <Details title="Description" defaultOpen>
              {product.description ? (
                <div className="rich-text text-sm" dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="text-sm text-muted-foreground">{product.shortDescription}</p>
              )}
            </Details>
            <Details title="Fabric, fit & care">
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                {product.fabric && <Row label="Fabric" value={product.fabric} />}
                {product.fit && <Row label="Fit" value={product.fit} />}
                {product.brand && <Row label="Brand" value={product.brand} />}
                <Row label="Weight" value={`${product.weightGrams} g`} />
                {product.careInstructions && <Row label="Care" value={product.careInstructions} />}
              </dl>
            </Details>
            {product.sizeChart && (
              <Details title="Size chart">
                <SizeChartTable chart={product.sizeChart} />
              </Details>
            )}
            <Details title="Delivery & returns">
              <div className="space-y-2 text-sm text-muted-foreground">
                {shipping?.zones.map((z) => (
                  <p key={z.code}>
                    <strong className="text-foreground">{z.name}:</strong> {formatPrice(z.baseCharge)} · {z.estimatedDays}
                  </p>
                ))}
                <p>Cash on delivery available everywhere in Bangladesh. Easy 7-day size exchange — see our <Link href="/pages/return-refund-policy" className="underline">return policy</Link>.</p>
              </div>
            </Details>
          </div>
          <div>
            {product.menus.length > 0 && (
              <div className="mb-8">
                <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Found in</p>
                <div className="flex flex-wrap gap-2">
                  {product.menus.map((m) => (
                    <Link key={m.id} href={`/collections/${m.slug}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">{m.name}</Link>
                  ))}
                </div>
              </div>
            )}
            {product.tags.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded bg-muted px-2.5 py-1 text-xs hover:bg-border">#{t}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 border-t pt-12">
          <ProductReviews productId={product.id} average={product.rating.average} count={product.rating.count} />
        </div>
      </div>

      <div className="border-t">
        <ProductSection title="You may also like" products={related} />
      </div>
    </>
  );
}

function Details({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b pb-2" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-xl leading-none text-muted-foreground transition group-open:rotate-45">+</span>
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function DeliveryNote({ shipping, freeOver }: { shipping: ShippingInfo | null; freeOver: number }) {
  const inside = shipping?.zones.find((z) => z.code === "INSIDE_DHAKA") ?? shipping?.zones[0];
  const outside = shipping?.zones.find((z) => z.isDefault) ?? shipping?.zones.at(-1);
  const items = [
    { icon: Truck, text: inside && outside ? `Inside Dhaka ${formatPrice(inside.baseCharge)} (${inside.estimatedDays}) · Outside Dhaka ${formatPrice(outside.baseCharge)} (${outside.estimatedDays})` : "Fast delivery all over Bangladesh" },
    { icon: Wallet, text: "Cash on delivery available" },
    { icon: RefreshCcw, text: "Easy 7-day size exchange" },
    ...(freeOver > 0 ? [{ icon: ShieldCheck, text: `Free delivery on orders over ${formatPrice(freeOver)}` }] : []),
  ];
  return (
    <ul className="space-y-2.5 rounded-lg border p-4 text-sm">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-3">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

