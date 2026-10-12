/**
 * Shapes returned by the admin catalog endpoints
 * (backend/src/modules/{product,menu,attribute,inventory,media,review}).
 */

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type Gender = "MEN" | "WOMEN" | "UNISEX" | "KIDS";

/** GET /admin/products → items[] */
export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  isFeatured: boolean;
  soldCount: number;
  image: string | null;
  /** Total units across active variants */
  stock: number;
  variantCount: number;
  menus: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
};

/** Extra fields next to `items` in GET /admin/products */
export type AdminProductListExtra = { statusCounts: Partial<Record<ProductStatus, number>> };

export type Size = { id: string; name: string; sortOrder: number; variantCount?: number };
export type Color = { id: string; name: string; hex: string; sortOrder: number; variantCount?: number };

export type AdminProductImage = { id: string; url: string; alt: string | null; sortOrder: number; colorId: string | null };

export type AdminVariant = {
  id: string;
  sizeId: string | null;
  colorId: string | null;
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  size: Size | null;
  color: Color | null;
};

/** GET /admin/products/:id */
export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  gender: Gender;
  fabric: string | null;
  fit: string | null;
  careInstructions: string | null;
  tags: string[];
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  weightGrams: number;
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  sizeChartId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  ogImage: string | null;
  soldCount: number;
  viewCount: number;
  ratingAvg: number;
  ratingCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: AdminProductImage[];
  variants: AdminVariant[];
  menuIds: string[];
};

export type MenuType = "COLLECTION" | "LINK";

/** GET /admin/menus → nested tree */
export type AdminMenu = {
  id: string;
  name: string;
  slug: string;
  type: MenuType;
  url: string | null;
  parentId: string | null;
  sortOrder: number;
  image: string | null;
  bannerImage: string | null;
  description: string | null;
  isActive: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
  showOnHome: boolean;
  homeSection: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  children: AdminMenu[];
};

/** GET /admin/size-charts */
export type AdminSizeChart = {
  id: string;
  name: string;
  unit: string;
  columns: string[];
  rows: string[][];
  note: string | null;
  productCount?: number;
};

/** GET /admin/inventory → one row per variant */
export type InventoryRow = {
  id: string;
  sku: string;
  stock: number;
  size: string | null;
  color: { name: string; hex: string } | null;
  product: { id: string; name: string; slug: string; image: string | null };
};

export type InventorySummary = { lowStock: number; outOfStock: number; totalUnits: number; threshold: number };

export type StockReason = "INITIAL" | "RESTOCK" | "ADJUSTMENT" | "ORDER" | "ORDER_CANCELLED" | "RETURN";

/** GET /admin/inventory/:variantId/history */
export type InventoryMovement = {
  id: string;
  variantId: string;
  change: number;
  balance: number;
  reason: StockReason;
  note: string | null;
  orderId: string | null;
  userId: string | null;
  createdAt: string;
};

export const MEDIA_FOLDERS = ["products", "menus", "banners", "pages", "brand", "general"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

/** GET /admin/media */
export type MediaRecord = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string;
  uploadedById: string | null;
  createdAt: string;
};

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

/** GET /admin/reviews */
export type AdminReview = {
  id: string;
  productId: string;
  userId: string | null;
  name: string;
  rating: number;
  title: string | null;
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string; slug: string };
};
