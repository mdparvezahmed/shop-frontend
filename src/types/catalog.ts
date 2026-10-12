/** Catalog shapes returned by the API (see backend/src/modules/product|menu). */

export type ImageRef = { url: string; alt: string | null };

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  image: ImageRef | null;
  hoverImage: ImageRef | null;
  inStock: boolean;
  colors: { name: string; hex: string }[];
  rating: { average: number; count: number };
  isNew: boolean;
};

export type ProductVariant = {
  id: string;
  sku: string;
  sizeId: string | null;
  colorId: string | null;
  size: string | null;
  color: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
};

export type SizeChart = {
  id: string;
  name: string;
  unit: string;
  columns: string[];
  rows: string[][];
  note: string | null;
};

export type Breadcrumb = { name: string; slug: string; href: string };

export type ProductDetail = ProductCard & {
  sku: string;
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  gender: string;
  fabric: string | null;
  fit: string | null;
  careInstructions: string | null;
  tags: string[];
  weightGrams: number;
  images: { id: string; url: string; alt: string | null; colorId: string | null }[];
  options: {
    sizes: { id: string; name: string }[];
    colors: { id: string; name: string; hex: string }[];
  };
  variants: ProductVariant[];
  sizeChart: SizeChart | null;
  menus: { id: string; name: string; slug: string }[];
  breadcrumbs: Breadcrumb[];
  seo: { title: string | null; description: string | null; keywords: string[]; ogImage: string | null };
  publishedAt: string | null;
  updatedAt: string;
};

export type NavItem = {
  id: string;
  name: string;
  slug: string;
  href: string;
  image: string | null;
  children: NavItem[];
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  href: string;
  type: "COLLECTION" | "LINK";
  description: string | null;
  image: string | null;
  bannerImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
  breadcrumbs: Breadcrumb[];
  children: { id: string; name: string; slug: string; href: string; image: string | null }[];
};

export type Facets = {
  sizes: string[];
  colors: { name: string; hex: string }[];
  price: { min: number; max: number };
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  link: string | null;
  buttonText: string | null;
  placement: "HERO" | "PROMO";
};

export type HomeData = {
  banners: { hero: Banner[]; promo: Banner[] };
  categories: { id: string; name: string; slug: string; href: string; image: string | null }[];
  newArrivals: ProductCard[];
  bestSellers: ProductCard[];
  featured: ProductCard[];
  sections: { id: string; name: string; slug: string; href: string; products: ProductCard[] }[];
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
};

export type ContentPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};
