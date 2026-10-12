import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { formatDate, plainText } from "@/lib/utils";
import { getPage } from "@/services/storefront.server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Page not found" };
  return pageMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription || plainText(page.content),
    path: `/pages/${slug}`,
    type: "article",
  });
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <Breadcrumbs items={[{ name: page.title, href: `/pages/${slug}` }]} />
      <h1 className="text-3xl font-semibold sm:text-4xl">{page.title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated {formatDate(page.updatedAt)}</p>
      <div className="rich-text mt-8" dangerouslySetInnerHTML={{ __html: page.content }} />
    </article>
  );
}
