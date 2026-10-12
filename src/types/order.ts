export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
export type PaymentMethod = "COD" | "SSLCOMMERZ";
export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type CartLine = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  size: string | null;
  color: string | null;
  image: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  available: number;
  lineTotal: number;
  weightGrams: number;
};

export type CartIssue = {
  variantId: string;
  type: "UNAVAILABLE" | "OUT_OF_STOCK" | "QUANTITY_REDUCED";
  message: string;
};

export type CheckoutQuote = {
  lines: CartLine[];
  issues: CartIssue[];
  coupon: { code: string; type: string; description: string | null; discount: number; freeShipping: boolean } | null;
  couponError: string | null;
  shipping: {
    zone: { code: string; name: string; estimatedDays: string };
    baseCharge: number;
    charge: number;
    codCharge: number;
    isFree: boolean;
    weightGrams: number;
  } | null;
  totals: {
    subtotal: number;
    discount: number;
    shippingCharge: number;
    codCharge: number;
    total: number;
    totalWeightGrams: number;
    itemCount: number;
  };
};

export type PlacedOrder = {
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethod;
  gatewayUrl: string | null;
  paymentError: string | null;
};

export type CustomerOrder = {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
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
  dueAmount: number;
  couponCode: string | null;
  courier: { provider: string | null; consignmentId: string; status: string | null } | null;
  items: {
    id: string;
    name: string;
    slug: string | null;
    sku: string;
    size: string | null;
    color: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  timeline: { status: OrderStatus | null; title: string; note: string | null; createdAt: string }[];
  canCancel: boolean;
  canPay: boolean;
  createdAt: string;
};

export type OrderSummary = {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
  previewItems: { name: string; image: string | null; quantity: number }[];
  createdAt: string;
};

export type ShippingInfo = {
  districts: string[];
  zones: {
    code: string;
    name: string;
    baseCharge: number;
    baseWeightGrams: number;
    extraChargePerKg: number;
    estimatedDays: string;
    districts: string[];
    isDefault: boolean;
  }[];
};
