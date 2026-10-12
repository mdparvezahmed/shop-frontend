import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/store/layout/announcement-bar";
import { BottomNav } from "@/components/store/layout/bottom-nav";
import { CartDrawer } from "@/components/store/cart/cart-drawer";
import { Footer } from "@/components/store/layout/footer";
import { Header } from "@/components/store/layout/header";
import { MobileMenu } from "@/components/store/layout/mobile-menu";
import { SearchOverlay } from "@/components/store/layout/search-overlay";
import { JsonLd } from "@/components/shared/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { getLayout } from "@/services/storefront.server";

/** Store-wide SEO defaults; every page overrides title/description/canonical. */
export async function generateMetadata(): Promise<Metadata> {
  const { store, seo } = await getLayout();
  return {
    title: { default: seo.title, template: `%s | ${seo.titleSuffix || store.name}` },
    description: seo.description,
    keywords: seo.keywords,
    applicationName: store.name,
    icons: store.favicon ? { icon: store.favicon } : undefined,
    openGraph: {
      siteName: store.name,
      type: "website",
      locale: "en_BD",
      images: seo.ogImage ? [{ url: absoluteUrl(seo.ogImage) }] : undefined,
    },
    verification: seo.googleVerification ? { google: seo.googleVerification } : undefined,
    alternates: { canonical: absoluteUrl("/") },
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const layout = await getLayout();

  return (
    <>
      <JsonLd data={[organizationJsonLd(layout), websiteJsonLd(layout.store.name)]} />
      {layout.store.announcement && <AnnouncementBar text={layout.store.announcement} />}
      <Header layout={layout} />
      <main className="min-h-[60vh] pb-16 lg:pb-0">{children}</main>
      <Footer layout={layout} />

      {/* Client overlays */}
      <MobileMenu items={layout.navigation.header} store={layout.store} />
      <SearchOverlay />
      <CartDrawer freeShippingThreshold={layout.checkout.freeShippingThreshold} />
      <BottomNav />
    </>
  );
}
