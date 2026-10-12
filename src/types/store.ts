import type { NavItem } from "./catalog";

/** Settings + navigation the storefront layout needs (GET /storefront/layout). */
export type StoreSettings = {
  name: string;
  tagline: string;
  logo: string;
  logoDark: string;
  favicon: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  announcement: string;
  footerAbout: string;
  social: { facebook: string; instagram: string; youtube: string; tiktok: string };
};

export type SeoSettings = {
  title: string;
  titleSuffix: string;
  description: string;
  keywords: string[];
  ogImage: string;
  googleVerification: string;
  facebookPixelId: string;
  googleAnalyticsId: string;
};

export type PublicCheckoutSettings = {
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  freeShippingThreshold: number;
  minOrderAmount: number;
  checkoutNote: string;
};

export type StoreLayout = {
  store: StoreSettings;
  seo: SeoSettings;
  checkout: PublicCheckoutSettings;
  navigation: {
    header: NavItem[];
    footer: NavItem[];
    homeCategories: { id: string; name: string; slug: string; href: string; image: string | null }[];
  };
  footerPages: { title: string; slug: string }[];
};
