"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { ImageField } from "@/components/admin/image-picker";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SITE_URL } from "@/config/site";
import { cn, plainText, slugify } from "@/lib/utils";
import { ChipInput } from "./chip-input";
import { LabelWithCount } from "./char-count";
import { SEO_DESCRIPTION_IDEAL, SEO_TITLE_IDEAL, seoChecks, type ProductFormState } from "./product-form-model";

type Errors = Record<string, string[]>;
type SetField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
const siteHost = (() => {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "yourstore.com";
  }
})();

/** SEO title/description/keywords, URL slug and the social share image. */
export function SeoFields({
  form,
  set,
  errors,
  onSlugEdit,
}: {
  form: ProductFormState;
  set: SetField;
  errors: Errors;
  /** Called when the slug is typed by hand, so it stops following the name */
  onSlugEdit: () => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="URL slug" error={errors.slug} hint={`${siteHost}/products/${form.slug || "…"}`}>
        <Input
          value={form.slug}
          onChange={(e) => {
            onSlugEdit();
            set("slug", slugify(e.target.value) + (e.target.value.endsWith("-") ? "-" : ""));
          }}
          placeholder="oversized-graphic-tee"
          className="font-mono text-xs"
        />
      </Field>
      <Field label={<LabelWithCount label="SEO title" length={form.seoTitle.length} ideal={SEO_TITLE_IDEAL} min={30} />} error={errors.seoTitle} hint="Shown as the blue link in Google. Empty = product name.">
        <Input value={form.seoTitle} maxLength={120} onChange={(e) => set("seoTitle", e.target.value)} placeholder={form.name || "Oversized Graphic Tee – Buy Online in Bangladesh"} />
      </Field>
      <Field
        label={<LabelWithCount label="Meta description" length={form.seoDescription.length} ideal={SEO_DESCRIPTION_IDEAL} min={70} />}
        error={errors.seoDescription}
        hint="The grey text under the link. Empty = short description."
      >
        <Textarea rows={3} maxLength={320} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder="Mention the fabric, fit, price and cash on delivery…" />
      </Field>
      <Field label="Keywords" error={errors.seoKeywords} hint="Phrases people search for, e.g. “black t-shirt bangladesh”. Up to 20.">
        <ChipInput value={form.seoKeywords} onChange={(v) => set("seoKeywords", v)} max={20} placeholder="Add keyword…" invalid={!!errors.seoKeywords} />
      </Field>
      <Field label="Social share image" error={errors.ogImage} hint="Used on Facebook/WhatsApp links. 1200×630 works best. Empty = main product image.">
        <ImageField value={form.ogImage} onChange={(url) => set("ogImage", url)} folder="products" aspect="aspect-[1200/630]" label="Choose share image" />
      </Field>
    </div>
  );
}

/** How the product will roughly look in Google results. */
export function GooglePreview({ form }: { form: ProductFormState }) {
  const title = form.seoTitle || form.name || "Product name";
  const description = form.seoDescription || form.shortDescription || plainText(form.description, 300) || "Add a meta description to control this text.";
  const image = form.images[0]?.url;
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Google preview</p>
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{siteHost.charAt(0).toUpperCase()}</span>
            <div className="min-w-0 text-xs leading-tight">
              <p className="truncate">{siteHost}</p>
              <p className="truncate text-muted-foreground">
                {SITE_URL} › products › {form.slug || "…"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-lg leading-snug text-sky-700 dark:text-sky-400">{truncate(title, SEO_TITLE_IDEAL)}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{truncate(description, SEO_DESCRIPTION_IDEAL)}</p>
        </div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-20 shrink-0 rounded-md object-cover" />
        )}
      </div>
    </div>
  );
}

/** Score + list of simple, actionable SEO checks. */
export function SeoChecklist({ form }: { form: ProductFormState }) {
  const checks = seoChecks(form);
  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const tone = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-sale";
  const bar = score >= 80 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-sale";

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-medium">SEO score</p>
        <p className={cn("text-2xl font-semibold tabular-nums", tone)}>{score}</p>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${score}%` }} />
      </div>
      <ul className="space-y-2.5">
        {checks.map((c) => (
          <li key={c.label} className="flex gap-2 text-sm">
            {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
            <span>
              <span className={cn(c.ok && "text-muted-foreground")}>{c.label}</span>
              {!c.ok && c.hint && <span className="block text-xs text-muted-foreground">{c.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
