import type { OrderStatus, PaymentMethod, PaymentStatus } from "./order";
import type { SeoSettings, StoreSettings } from "./store";
import type { User } from "./user";

/**
 * Admin shapes for operations, sales, content and settings screens.
 * They mirror the backend modules: dashboard, order, courier, user, shipping,
 * banner, page, setting and engagement.
 */

// ── Dashboard (GET /admin/dashboard?days=) ─────────────────────────────────────

export type DashboardRange = 1 | 7 | 30 | 90 | 365;
export type Kpi = { value: number; change: number };
export type SalesPoint = { date: string; revenue: number; orders: number };

export type DashboardRecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
};

export type DashboardTopProduct = {
  id: string;
  name: string;
  slug?: string;
  image: string | null;
  quantity: number;
  revenue: number;
};

export type DashboardData = {
  range: { days: number; from: string; to: string };
  kpis: { revenue: Kpi; orders: Kpi; averageOrder: Kpi; newCustomers: Kpi };
  sales: SalesPoint[];
  statusCounts: Partial<Record<OrderStatus, number>>;
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  stock: { lowStock: number; outOfStock: number; totalUnits: number; threshold: number };
  attention: { pendingOrders: number; unreadMessages: number; pendingReviews: number; lowStock: number; outOfStock: number };
};

// ── Orders ─────────────────────────────────────────────────────────────────────

/** Row of GET /admin/orders */
export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  district: string;
  shippingZone: string;
  total: number;
  paidAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  consignmentId: string | null;
  courierStatus: string | null;
  createdAt: string;
  itemCount: number;
};

export type OrderStatusCounts = Partial<Record<OrderStatus, number>>;

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  product: { slug: string } | null;
};

export type OrderHistoryEntry = {
  id: string;
  status: OrderStatus | null;
  title: string;
  note: string | null;
  /** false = internal note, hidden from the customer */
  isPublic: boolean;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
};

export type OrderPayment = {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  tranId: string;
  valId: string | null;
  bankTranId: string | null;
  cardType: string | null;
  createdAt: string;
  updatedAt: string;
};

/** GET /admin/orders/:id — every mutation on an order returns this too. */
export type AdminOrder = {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  district: string;
  area: string;
  addressLine: string;
  shippingZone: string;
  note: string | null;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  codCharge: number;
  total: number;
  paidAmount: number;
  couponCode: string | null;
  totalWeightGrams: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  courierProvider: string | null;
  consignmentId: string | null;
  courierStatus: string | null;
  courierFee: number | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
  history: OrderHistoryEntry[];
  payments: OrderPayment[];
  user: { id: string; name: string; phone: string | null; email: string | null } | null;
  allowedTransitions: OrderStatus[];
};

// ── Pathao courier look-ups ────────────────────────────────────────────────────

export type PathaoCity = { city_id: number; city_name: string };
export type PathaoZone = { zone_id: number; zone_name: string };
export type PathaoArea = { area_id: number; area_name: string; home_delivery_available: boolean; pickup_available: boolean };
export type PathaoStore = { store_id: number; store_name: string; store_address: string; is_active: number; is_default_store?: boolean };

/** Body of POST /admin/orders/:id/courier */
export type SendToCourierInput = {
  cityId?: number;
  zoneId?: number;
  areaId?: number;
  weightKg?: number;
  deliveryType?: 48 | 12;
  itemType?: 1 | 2;
  instruction?: string;
  amountToCollect?: number;
};

// ── Customers & staff ──────────────────────────────────────────────────────────

export type CustomerRow = User & { orderCount: number; totalSpent: number };

export type CustomerAddress = {
  id: string;
  label: string;
  name: string;
  phone: string;
  district: string;
  area: string;
  addressLine: string;
  isDefault: boolean;
};

export type CustomerDetail = User & {
  addresses: CustomerAddress[];
  orders: { id: string; orderNumber: string; total: number; status: OrderStatus; paymentStatus: PaymentStatus; createdAt: string }[];
  stats: { orders: number; totalSpent: number };
};

export type StaffRole = "STAFF" | "MANAGER" | "ADMIN";

// ── Shipping zones ─────────────────────────────────────────────────────────────

export type ShippingZone = {
  id: string;
  name: string;
  code: string;
  baseCharge: number;
  baseWeightGrams: number;
  extraChargePerKg: number;
  codChargePercent: number;
  estimatedDays: string;
  districts: string[];
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** GET /admin/shipping-zones */
export type ShippingZonesResponse = { zones: ShippingZone[]; districts: string[] };

// ── Banners ────────────────────────────────────────────────────────────────────

export type BannerPlacement = "HERO" | "PROMO";

export type AdminBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  link: string | null;
  buttonText: string | null;
  placement: BannerPlacement;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Recommended image sizes per placement, e.g. { HERO: { desktop: "1600×640", mobile: "800×1000" } } */
export type BannerSizes = Record<BannerPlacement, { desktop: string; mobile: string }>;

// ── CMS pages ──────────────────────────────────────────────────────────────────

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  showInFooter: boolean;
  createdAt: string;
  updatedAt: string;
};

// ── Settings (GET /admin/settings) ─────────────────────────────────────────────

export type CheckoutSettings = {
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  /** Orders at or above this subtotal ship free. 0 = never free. */
  freeShippingThreshold: number;
  minOrderAmount: number;
  /** Prefix for order numbers, e.g. "UT" → UT2610120001 */
  orderPrefix: string;
  checkoutNote: string;
};

export type CourierSettings = {
  pathaoStoreId: string;
  deliveryType: 48 | 12;
  itemType: 1 | 2;
  defaultInstruction: string;
};

export type AdminSettings = {
  store: StoreSettings;
  seo: SeoSettings;
  checkout: CheckoutSettings;
  courier: CourierSettings;
  integrations: { sslcommerz: boolean; pathao: boolean };
};

export type SettingKey = "store" | "seo" | "checkout" | "courier";

// ── Engagement ─────────────────────────────────────────────────────────────────

export type ContactMessage = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type Subscriber = { id: string; email: string; createdAt: string };
