"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { ImageGallery } from "@/components/admin/image-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/misc";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import { cn, formatPrice, plainText, slugify } from "@/lib/utils";
import type { AdminMenu, AdminProduct, AdminSizeChart, Color, ProductStatus, Size } from "@/types/admin-catalog";
import { ChipInput } from "./chip-input";
import { LabelWithCount } from "./char-count";
import { MenuPicker } from "./menu-picker";
import {
  GENDERS,
  SHORT_DESCRIPTION_MAX,
  discountPercent,
  emptyProductForm,
  formToBody,
  productToForm,
  type ProductFormState,
} from "./product-form-model";
// SeoChecklist is imported for the commented-out checklist card below.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GooglePreview, SeoChecklist, SeoFields } from "./seo-section";
import { VariantEditor } from "./variant-editor";

type Errors = Record<string, string[]>;

/** Which card each API field error belongs to, so we can scroll to it. */
const SECTION_OF: Record<string, string> = {
  name: "basic",
  shortDescription: "basic",
  description: "basic",
  images: "media",
  price: "pricing",
  compareAtPrice: "pricing",
  costPrice: "pricing",
  weightGrams: "pricing",
  sku: "pricing",
  variants: "variants",
  menuIds: "menus",
  brand: "details",
  gender: "details",
  fabric: "details",
  fit: "details",
  careInstructions: "details",
  tags: "details",
  sizeChartId: "details",
  slug: "seo",
  seoTitle: "seo",
  seoDescription: "seo",
  seoKeywords: "seo",
  ogImage: "seo",
};

const STATUS_HELP: Record<ProductStatus, string> = {
  DRAFT: "Hidden from the store while you work on it.",
  ACTIVE: "Visible to shoppers and searchable.",
  ARCHIVED: "Hidden. Kept for order history.",
};

function Section({ id, title, description, action, children }: { id: string; title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <div id={id} className="scroll-mt-24" />
      <CardHeader title={title} description={description} action={action} />
      <div className="p-5">{children}</div>
    </Card>
  );
}

/**
 * The one product editor used by /admin/products/new and /admin/products/[id].
 * Two columns on desktop (content + sidebar), one on phones, with a sticky save bar.
 */
export function ProductForm({ product, onSaved }: { product?: AdminProduct; onSaved: (product: AdminProduct) => void }) {
  const [initial, setInitial] = useState<ProductFormState>(() => (product ? productToForm(product) : emptyProductForm()));
  const [form, setForm] = useState<ProductFormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  /** New products: the slug follows the name until it is edited by hand. */
  const [slugTouched, setSlugTouched] = useState(!!product);

  const { data: sizes, isLoading: sizesLoading } = useSWR<Size[]>("/admin/sizes");
  const { data: colors, isLoading: colorsLoading } = useSWR<Color[]>("/admin/colors");
  const { data: menus, isLoading: menusLoading } = useSWR<AdminMenu[]>("/admin/menus");
  const { data: sizeCharts } = useSWR<AdminSizeChart[]>("/admin/size-charts");

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setName = (name: string) => setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));

  const price = Number(form.price || 0);
  const compareAt = Number(form.compareAtPrice || 0);
  const cost = Number(form.costPrice || 0);
  const discount = discountPercent(price, compareAt);
  const margin = price > 0 && form.costPrice !== "" ? Math.round(((price - cost) / price) * 100) : null;
  const descriptionLength = plainText(form.description, 100000).length;
  const selectedColors = (colors ?? []).filter((c) => form.colorIds.includes(c.id));

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const body = formToBody(form);
      const saved = product ? await api.put<AdminProduct>(`/admin/products/${product.id}`, body) : await api.post<AdminProduct>("/admin/products", body);
      const next = productToForm(saved);
      setInitial(next);
      setForm(next);
      setSlugTouched(true);
      toast.success(product ? "Product saved" : "Product created");
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        setErrors(fieldErrors);
        const first = Object.keys(fieldErrors).map((k) => SECTION_OF[k]).find(Boolean);
        if (first) document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const err = (key: string) => errors[key]?.[0];

  return (
    <form onSubmit={save} noValidate>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Main column ───────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <Section id="basic" title="Basic information" description="What shoppers see first. A clear name and a detailed description help the product rank on Google.">
            <div className="space-y-4">
              <Field label="Product name" required error={errors.name} hint="Include the type, style and colour if it is single-colour.">
                <Input value={form.name} onChange={(e) => setName(e.target.value)} placeholder="Oversized Graphic Print T-Shirt" maxLength={150} aria-invalid={!!errors.name} />
              </Field>
              <Field
                label={<LabelWithCount label="Short description" length={form.shortDescription.length} ideal={SHORT_DESCRIPTION_MAX} min={40} />}
                error={errors.shortDescription}
                hint="One or two sentences shown next to the price and used as the meta description if you leave that empty."
              >
                <Textarea
                  rows={3}
                  maxLength={SHORT_DESCRIPTION_MAX}
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  placeholder="Heavyweight 220 GSM cotton tee with a relaxed drop-shoulder fit and a bold back print."
                />
              </Field>
              <Field
                label="Full description"
                error={errors.description}
                hint={`${descriptionLength} characters — aim for 300+. Use headings (Fabric & fit, Why you'll love it) and bullet lists.`}
              >
                <RichTextEditor value={form.description} onChange={(html) => set("description", html)} placeholder="Describe the fabric, fit, print, sizing advice and care…" />
              </Field>
            </div>
          </Section>

          <Section
            id="media"
            title="Images"
            description={
              <>
                The first image is the main image. Use 4:5 portrait photos (e.g. 1200×1500), show front, back and close-ups, and write alt text for every photo.
                {form.colorIds.length > 0 && " Tie images to a colour so they switch when a shopper picks it."}
              </>
            }
          >
            <ImageGallery value={form.images} onChange={(images) => set("images", images)} folder="products" colors={selectedColors.length ? selectedColors : undefined} />
            {errors.images && <p className="mt-2 text-xs text-sale">{errors.images[0]}</p>}
          </Section>

          <Section id="pricing" title="Pricing" description="Prices are whole taka.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (৳)" required error={errors.price} hint="What the customer pays.">
                <Input type="number" min={0} inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="890" aria-invalid={!!errors.price} />
              </Field>
              <Field
                label="Compare-at price (৳)"
                error={errors.compareAtPrice}
                hint={
                  form.compareAtPrice === "" ? (
                    "Original price, shown struck through. Leave empty if not on sale."
                  ) : discount > 0 ? (
                    <span className="text-success">Shows as {discount}% OFF on the store</span>
                  ) : (
                    <span className="text-warning">Must be higher than the price to show a discount</span>
                  )
                }
              >
                <Input type="number" min={0} inputMode="numeric" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="1190" aria-invalid={!!errors.compareAtPrice} />
              </Field>
              <Field
                label="Cost price (৳)"
                error={errors.costPrice}
                hint={
                  margin === null ? (
                    "What the product costs you. Only staff see this."
                  ) : (
                    <span className={margin < 0 ? "text-sale" : margin < 20 ? "text-warning" : "text-success"}>
                      Margin {margin}% · {formatPrice(price - cost)} profit per item
                    </span>
                  )
                }
              >
                <Input type="number" min={0} inputMode="numeric" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} placeholder="420" />
              </Field>
              <Field label="Weight (grams)" required error={errors.weightGrams} hint="Packed weight. Used to calculate the delivery charge — a t-shirt is usually 200–300 g.">
                <Input type="number" min={1} max={30000} inputMode="numeric" value={form.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} />
              </Field>
              <Field label="Product SKU" error={errors.sku} hint="Leave empty to generate one. Variant SKUs are built from it." className="sm:col-span-2">
                <Input value={form.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="Auto (e.g. UT-1024)" className="font-mono uppercase sm:max-w-xs" maxLength={40} />
              </Field>
            </div>
          </Section>

          <Section id="variants" title="Sizes, colours & stock" description="Pick the sizes and colours you sell — every combination gets its own stock.">
            <VariantEditor
              sizes={sizes}
              colors={colors}
              loading={sizesLoading || colorsLoading}
              value={{ sizeIds: form.sizeIds, colorIds: form.colorIds, variants: form.variants }}
              onChange={(v) => setForm((f) => ({ ...f, ...v }))}
              basePrice={form.price}
              error={err("variants")}
            />
          </Section>

          <Section
            id="menus"
            title="Menus & collections"
            description="Choose every menu this product should appear in. Products in a sub-menu also show in its parent collections."
          >
            <MenuPicker menus={menus} loading={menusLoading} value={form.menuIds} onChange={(ids) => set("menuIds", ids)} error={err("menuIds")} />
          </Section>

          <Section id="details" title="Product details" description="Shown in the specifications on the product page and used in search.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand" error={errors.brand}>
                <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} maxLength={60} placeholder="Urban Thread" />
              </Field>
              <Field label="Gender" error={errors.gender}>
                <Select value={form.gender} onChange={(e) => set("gender", e.target.value as ProductFormState["gender"])}>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Fabric" error={errors.fabric} hint="e.g. 100% combed cotton, 180 GSM">
                <Input value={form.fabric} onChange={(e) => set("fabric", e.target.value)} maxLength={150} />
              </Field>
              <Field label="Fit" error={errors.fit} hint="e.g. Regular fit, Oversized, Slim fit">
                <Input value={form.fit} onChange={(e) => set("fit", e.target.value)} maxLength={80} />
              </Field>
              <Field label="Care instructions" error={errors.careInstructions} className="sm:col-span-2">
                <Textarea rows={2} maxLength={500} value={form.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} placeholder="Machine wash cold, inside out. Do not iron on print." />
              </Field>
              <Field label="Tags" error={errors.tags} hint="Help shoppers find it in search: graphic, summer, cotton…" className="sm:col-span-2">
                <ChipInput value={form.tags} onChange={(v) => set("tags", v)} max={30} placeholder="Add tag…" invalid={!!errors.tags} />
              </Field>
              <Field
                label="Size chart"
                error={errors.sizeChartId}
                hint={
                  <>
                    Shown in a “Size guide” popup. <Link href="/admin/size-charts" className="underline">Manage size charts</Link>
                  </>
                }
                className="sm:col-span-2"
              >
                <Select value={form.sizeChartId} onChange={(e) => set("sizeChartId", e.target.value)}>
                  <option value="">No size chart</option>
                  {sizeCharts?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Section>

          <Section id="seo" title="Search engine listing" description="Control how this product appears on Google and when shared on social media.">
            <div className="space-y-5">
              <GooglePreview form={form} />
              <SeoFields form={form} set={set} errors={errors} onSlugEdit={() => setSlugTouched(true)} />
            </div>
          </Section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Organization" />
            <div className="space-y-4 p-5">
              <Field label="Status" error={errors.status} hint={STATUS_HELP[form.status]}>
                <Select value={form.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </Field>
              <Switch checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured" description="Show in the featured row on the home page" />
              <Switch checked={form.isNewArrival} onChange={(v) => set("isNewArrival", v)} label="New arrival" description="Adds a “New” badge and lists it under New Arrivals" />
            </div>
          </Card>

          <div className="space-y-6 lg:sticky lg:top-24">
            {/* SEO checklist — hidden for now; uncomment to show it again.
            <Card>
              <CardHeader title="SEO checklist" description="Tick these off for better Google ranking." />
              <div className="p-5">
                <SeoChecklist form={form} />
              </div>
            </Card>
            */}
            {product && (
              <Card className="p-5 text-sm">
                <dl className="grid grid-cols-2 gap-y-2">
                  <dt className="text-muted-foreground">Sold</dt>
                  <dd className="text-right tabular-nums">{product.soldCount}</dd>
                  <dt className="text-muted-foreground">Views</dt>
                  <dd className="text-right tabular-nums">{product.viewCount}</dd>
                  <dt className="text-muted-foreground">Rating</dt>
                  <dd className="text-right tabular-nums">{product.ratingCount ? `${product.ratingAvg.toFixed(1)} (${product.ratingCount})` : "—"}</dd>
                </dl>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky save bar ─────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={cn("text-sm", dirty ? "text-warning" : "text-muted-foreground")}>
            {dirty ? "You have unsaved changes" : product ? "All changes saved" : "Fill in the details and save"}
          </p>
          <div className="flex flex-wrap gap-2">
            {dirty && (
              <Button variant="outline" onClick={() => { setForm(initial); setErrors({}); }}>
                Discard
              </Button>
            )}
            <Button type="submit" loading={saving} disabled={!!product && !dirty}>
              {product ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
