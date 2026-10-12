"use client";

import { api } from "@/lib/api/client";
import type {
  Address,
  CartIssue,
  CartLine,
  CheckoutQuote,
  CustomerOrder,
  OrderSummary,
  PaymentMethod,
  PlacedOrder,
  ProductCard,
  Review,
  ShippingInfo,
  User,
} from "@/types";

/**
 * Client-side calls used by interactive storefront components
 * (cart, checkout, account, auth). Grouped by feature.
 */

export type CartItemInput = { variantId: string; quantity: number };

export const authApi = {
  login: (identifier: string, password: string) => api.post<{ user: User }>("/auth/login", { identifier, password }),
  adminLogin: (identifier: string, password: string) => api.post<{ user: User }>("/auth/admin-login", { identifier, password }),
  register: (data: { name: string; phone: string; email?: string; password: string }) =>
    api.post<{ user: User }>("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<User>("/auth/me"),
  updateProfile: (data: Partial<Pick<User, "name" | "email" | "phone">>) => api.patch<User>("/auth/me", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

export const catalogApi = {
  products: (query: Record<string, unknown>) => api.paged<ProductCard>("/products", query),
  reviews: (productId: string, page = 1) =>
    api.pagedWith<{ items: Review[]; stars: Record<string, number> }>(`/reviews/product/${productId}`, { page }),
  submitReview: (data: { productId: string; rating: number; title?: string; comment: string; name?: string }) =>
    api.post<{ message: string }>("/reviews", data),
};

export const checkoutApi = {
  validateCart: (items: CartItemInput[]) => api.post<{ lines: CartLine[]; issues: CartIssue[] }>("/cart/validate", { items }),
  quote: (data: { items: CartItemInput[]; district?: string; couponCode?: string; paymentMethod?: PaymentMethod }) =>
    api.post<CheckoutQuote>("/checkout/quote", data),
  placeOrder: (data: {
    items: CartItemInput[];
    customer: { name: string; phone: string; email?: string };
    address: { district: string; area: string; addressLine: string };
    note?: string;
    couponCode?: string;
    paymentMethod: PaymentMethod;
    saveAddress?: boolean;
  }) => api.post<PlacedOrder>("/checkout/place-order", data),
  shippingInfo: () => api.get<ShippingInfo>("/shipping"),
  track: (orderNumber: string, phone: string) => api.post<CustomerOrder>("/orders/track", { orderNumber, phone }),
  retryPayment: (orderNumber: string, phone: string) => api.post<{ gatewayUrl: string }>("/payments/retry", { orderNumber, phone }),
};

export const accountApi = {
  orders: (page = 1) => api.paged<OrderSummary>("/account/orders", { page }),
  order: (orderNumber: string) => api.get<CustomerOrder>(`/account/orders/${orderNumber}`),
  cancelOrder: (orderNumber: string, reason?: string) => api.post<CustomerOrder>(`/account/orders/${orderNumber}/cancel`, { reason }),
  addresses: () => api.get<Address[]>("/account/addresses"),
  createAddress: (data: Omit<Address, "id">) => api.post<Address>("/account/addresses", data),
  updateAddress: (id: string, data: Omit<Address, "id">) => api.put<Address>(`/account/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/account/addresses/${id}`),
  wishlist: () => api.get<ProductCard[]>("/account/wishlist"),
  wishlistIds: () => api.get<string[]>("/account/wishlist/ids"),
  addToWishlist: (productId: string) => api.post<string[]>("/account/wishlist", { productId }),
  removeFromWishlist: (productId: string) => api.delete<string[]>(`/account/wishlist/${productId}`),
};

export const engagementApi = {
  subscribe: (email: string) => api.post<{ message: string }>("/newsletter", { email }),
  contact: (data: { name: string; email?: string; phone?: string; subject?: string; message: string }) =>
    api.post<{ message: string }>("/contact", data),
};
