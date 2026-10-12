import type { GalleryImage } from "@/components/admin/image-picker";
import { plainText } from "@/lib/utils";
import type { AdminProduct, Color, Gender, ProductStatus, Size } from "@/types/admin-catalog";

/**
 * Product editor state and the conversions to/from the API
 * (body must match `productUpsertSchema` in backend/src/modules/product/product.validation.ts).
 * Numbers are kept as strings while editing so inputs can be empty.
 */

export type VariantRow = {
  /** Existing variant id — sent back so the API keeps stock history and order links */
  id?: string;
  sizeId: string | null;
  colorId: string | null;
  sku: string;
  price: string;
  compareAtPrice: number | null;
  stock: string;
  isActive: boolean;
};

export type ProductFormState = {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  brand: string;
  gender: Gender;
  fabric: string;
  fit: string;
  careInstructions: string;
  tags: string[];
  price: string;
  compareAtPrice: string;
  costPrice: string;
  weightGrams: string;
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  sizeChartId: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  ogImage: string | null;
  menuIds: string[];
  images: GalleryImage[];
  sizeIds: string[];
  colorIds: string[];
  variants: VariantRow[];
};

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
  { value: "UNISEX", label: "Unisex" },
  { value: "KIDS", label: "Kids" },
];

/** SEO length guides (what Google shows before truncating). */
export const SEO_TITLE_IDEAL = 60;
export const SEO_DESCRIPTION_IDEAL = 160;
export const SHORT_DESCRIPTION_MAX = 400;

const str = (v: string | null | undefined) => v ?? "";
const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const unique = <T,>(list: T[]) => [...new Set(list)];

export const comboKey = (sizeId: string | null, colorId: string | null) => `${sizeId ?? ""}|${colorId ?? ""}`;

export function emptyProductForm(): ProductFormState {
  return {
    name: "",
    slug: "",
    sku: "",
    shortDescription: "",
    description: "",
    brand: "",
    gender: "MEN",
    fabric: "",
    fit: "",
    careInstructions: "",
    tags: [],
    price: "",
    compareAtPrice: "",
    costPrice: "",
    weightGrams: "250",
    status: "DRAFT",
    isFeatured: false,
    isNewArrival: true,
    sizeChartId: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    ogImage: null,
    menuIds: [],
    images: [],
    sizeIds: [],
    colorIds: [],
    variants: [{ sizeId: null, colorId: null, sku: "", price: "", compareAtPrice: null, stock: "0", isActive: true }],
  };
}

export function productToForm(p: AdminProduct): ProductFormState {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    shortDescription: str(p.shortDescription),
    description: str(p.description),
    brand: str(p.brand),
    gender: p.gender,
    fabric: str(p.fabric),
    fit: str(p.fit),
    careInstructions: str(p.careInstructions),
    tags: p.tags,
    price: num(p.price),
    compareAtPrice: num(p.compareAtPrice),
    costPrice: num(p.costPrice),
    weightGrams: num(p.weightGrams),
    status: p.status,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    sizeChartId: str(p.sizeChartId),
    seoTitle: str(p.seoTitle),
    seoDescription: str(p.seoDescription),
    seoKeywords: p.seoKeywords,
    ogImage: p.ogImage,
    menuIds: p.menuIds,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt, colorId: i.colorId })),
    sizeIds: unique(p.variants.map((v) => v.sizeId).filter((x): x is string => !!x)),
    colorIds: unique(p.variants.map((v) => v.colorId).filter((x): x is string => !!x)),
    variants: p.variants.map((v) => ({
      id: v.id,
      sizeId: v.sizeId,
      colorId: v.colorId,
      sku: v.sku,
      price: num(v.price),
      compareAtPrice: v.compareAtPrice,
      stock: String(v.stock),
      isActive: v.isActive,
    })),
  };
}

/**
 * Request body for POST/PUT /admin/products.
 * Empty optional prices are sent as `undefined` (key dropped by JSON.stringify), NOT null:
 * the API's `optionalMoney` coerces null/"" to 0, and only a missing key becomes null.
 */
export function formToBody(f: ProductFormState) {
  const toInt = (v: string) => (v.trim() === "" ? undefined : Number(v));
  return {
    name: f.name,
    slug: f.slug || undefined,
    sku: f.sku.trim() || undefined,
    shortDescription: f.shortDescription || null,
    description: f.description || null,
    brand: f.brand || null,
    gender: f.gender,
    fabric: f.fabric || null,
    fit: f.fit || null,
    careInstructions: f.careInstructions || null,
    tags: f.tags,
    price: Number(f.price || 0),
    compareAtPrice: toInt(f.compareAtPrice),
    costPrice: toInt(f.costPrice),
    weightGrams: Number(f.weightGrams || 0),
    status: f.status,
    isFeatured: f.isFeatured,
    isNewArrival: f.isNewArrival,
    sizeChartId: f.sizeChartId || null,
    seoTitle: f.seoTitle || null,
    seoDescription: f.seoDescription || null,
    seoKeywords: f.seoKeywords,
    ogImage: f.ogImage || null,
    menuIds: f.menuIds,
    images: f.images.map((i) => ({ url: i.url, alt: i.alt?.trim() || null, colorId: i.colorId ?? null })),
    variants: f.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      sizeId: v.sizeId,
      colorId: v.colorId,
      ...(v.sku.trim() ? { sku: v.sku.trim() } : {}),
      price: toInt(v.price),
      compareAtPrice: v.compareAtPrice ?? undefined,
      stock: Number(v.stock || 0),
      isActive: v.isActive,
    })),
  };
}

/**
 * Rebuilds the size × colour matrix after the chosen sizes/colours change.
 * Rows that already exist (same size+colour) keep their id, SKU, price and stock;
 * new combinations start with `newStock`. With nothing chosen the product is a
 * single variant without size or colour.
 */
export function buildVariantMatrix(
  sizeIds: string[],
  colorIds: string[],
  sizes: Size[],
  colors: Color[],
  current: VariantRow[],
  newStock = "0",
): VariantRow[] {
  const orderedSizes: (string | null)[] = sizes.filter((s) => sizeIds.includes(s.id)).map((s) => s.id);
  const orderedColors: (string | null)[] = colors.filter((c) => colorIds.includes(c.id)).map((c) => c.id);
  const sizeAxis = orderedSizes.length ? orderedSizes : [null];
  const colorAxis = orderedColors.length ? orderedColors : [null];
  const byKey = new Map(current.map((v) => [comboKey(v.sizeId, v.colorId), v]));

  return sizeAxis.flatMap((sizeId) =>
    colorAxis.map(
      (colorId) =>
        byKey.get(comboKey(sizeId, colorId)) ?? { sizeId, colorId, sku: "", price: "", compareAtPrice: null, stock: newStock, isActive: true },
    ),
  );
}

export const discountPercent = (price: number, compareAt: number) => (compareAt > price && price > 0 ? Math.round(((compareAt - price) / compareAt) * 100) : 0);

// ─── SEO checklist ───────────────────────────────────────────────────────────

export type SeoCheck = { label: string; ok: boolean; hint?: string };

export function seoChecks(f: ProductFormState): SeoCheck[] {
  const descText = plainText(f.description, 100000);
  const metaDesc = f.seoDescription || f.shortDescription;
  const title = f.seoTitle || f.name;
  return [
    { label: "Descriptive product name", ok: f.name.trim().length >= 15, hint: "Include type, style and colour, e.g. “Oversized Graphic Print T-Shirt”" },
    { label: "SEO title within 60 characters", ok: title.length > 0 && title.length <= SEO_TITLE_IDEAL, hint: "Longer titles are cut off in Google" },
    { label: "Meta description 70–160 characters", ok: metaDesc.length >= 70 && metaDesc.length <= SEO_DESCRIPTION_IDEAL, hint: "Sell the product in one or two sentences" },
    { label: "Full description has 300+ characters", ok: descText.length >= 300, hint: `${descText.length} characters so far` },
    { label: "Description uses headings or lists", ok: /<(h2|h3|ul|ol)\b/i.test(f.description), hint: "Structure helps shoppers and search engines" },
    { label: "Short description written", ok: f.shortDescription.trim().length >= 40 },
    { label: "At least 3 product images", ok: f.images.length >= 3, hint: `${f.images.length} added` },
    { label: "Every image has alt text", ok: f.images.length > 0 && f.images.every((i) => (i.alt ?? "").trim().length >= 5), hint: "Describe each photo — e.g. “Black oversized tee, back print”" },
    { label: "3+ keywords or tags", ok: unique([...f.seoKeywords, ...f.tags]).length >= 3 },
    { label: "Short, readable URL slug", ok: f.slug.length > 0 && f.slug.length <= 75 },
  ];
}
