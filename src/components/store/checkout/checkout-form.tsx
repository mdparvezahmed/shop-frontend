"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Lock, ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useAuth } from "@/hooks/use-auth";
import { useCartValidation } from "@/hooks/use-cart-validation";
import { useDebounce, useMounted } from "@/hooks/use-debounce";
import { ApiError, errorMessage } from "@/lib/api/client";
import { cn, formatPrice } from "@/lib/utils";
import { accountApi, checkoutApi } from "@/services/shop";
import { cartPayload, useCart } from "@/stores/cart-store";
import type { Address, PaymentMethod, PublicCheckoutSettings } from "@/types";
import { saveLastOrder } from "./last-order";
import { OrderSummary } from "./order-summary";
import { PaymentOptions } from "./payment-options";

type FormState = { name: string; phone: string; email: string; district: string; area: string; addressLine: string; note: string };
const EMPTY: FormState = { name: "", phone: "", email: "", district: "", area: "", addressLine: "", note: "" };

/**
 * One-page checkout. Every change to district / coupon / payment method
 * re-asks the server for a quote, so the total shown is always what is charged.
 */
export function CheckoutForm({ settings }: { settings: PublicCheckoutSettings }) {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const syncCart = useCart((s) => s.sync);
  const { user } = useAuth();
  useCartValidation();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [payment, setPayment] = useState<PaymentMethod>(settings.codEnabled ? "COD" : "SSLCOMMERZ");
  const [couponCode, setCouponCode] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [placing, setPlacing] = useState(false);

  const { data: shipping } = useSWR("shipping-info", () => checkoutApi.shippingInfo());
  const { data: addresses } = useSWR(user ? "my-addresses" : null, () => accountApi.addresses());

  // Pre-fill from the account and its default address.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, phone: f.phone || user.phone || "", email: f.email || user.email || "" }));
  }, [user]);
  useEffect(() => {
    const def = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
    if (def) applyAddress(def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  const applyAddress = (a: Address) =>
    setForm((f) => ({ ...f, name: a.name, phone: a.phone, district: a.district, area: a.area, addressLine: a.addressLine }));

  const payload = useMemo(() => cartPayload(items), [items]);
  const quoteKey = useDebounce(JSON.stringify({ payload, district: form.district, couponCode, payment }), 300);
  const { data: quote, isLoading: quoting } = useSWR(mounted && items.length ? ["quote", quoteKey] : null, () =>
    checkoutApi.quote({ items: payload, district: form.district || undefined, couponCode: couponCode || undefined, paymentMethod: payment }),
    { keepPreviousData: true },
  );

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    setErrors({});
    try {
      const order = await checkoutApi.placeOrder({
        items: payload,
        customer: { name: form.name, phone: form.phone, email: form.email || undefined },
        address: { district: form.district, area: form.area, addressLine: form.addressLine },
        note: form.note || undefined,
        couponCode: couponCode || undefined,
        paymentMethod: payment,
        saveAddress: !!user && saveAddress && !addresses?.length,
      });
      saveLastOrder({ orderNumber: order.orderNumber, phone: form.phone });
      clearCart();

      if (order.gatewayUrl) {
        toast.success("Redirecting to secure payment…");
        window.location.href = order.gatewayUrl;
        return;
      }
      if (order.paymentError) toast.error(order.paymentError);
      router.push(`/checkout/complete?order=${order.orderNumber}${order.paymentError ? "&payment=failed" : ""}`);
    } catch (error) {
      if (error instanceof ApiError) {
        // Nested zod paths come back flattened: "customer.phone" → phone
        const flat: Record<string, string[]> = {};
        Object.entries(error.fieldErrors).forEach(([k, v]) => (flat[k.split(".").pop()!] = v));
        setErrors(flat);
        // Stock changed while checking out: refresh the cart so the customer sees it.
        if (error.status === 409) {
          const fresh = await checkoutApi.validateCart(payload).catch(() => null);
          if (fresh) syncCart(fresh.lines, fresh.issues.filter((i) => i.type !== "QUANTITY_REDUCED").map((i) => i.variantId));
        }
      }
      toast.error(errorMessage(error));
      setPlacing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_420px]">
        <Skeleton className="h-[600px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ShoppingBag className="size-6" />} title="Your cart is empty" description="Add something to your cart before checking out." action={<ButtonLink href="/shop">Browse products</ButtonLink>} />
      </div>
    );
  }

  const belowMinimum = settings.minOrderAmount > 0 && (quote?.totals.subtotal ?? 0) < settings.minOrderAmount;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        {!user && (
          <p className="text-sm text-muted-foreground">
            Have an account? <Link href="/login?next=/checkout" className="font-medium text-foreground underline underline-offset-4">Log in</Link> for faster checkout
          </p>
        )}
      </div>

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
        <div className="space-y-8">
          <Section step={1} title="Contact information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name} className="sm:col-span-2">
                <Input value={form.name} onChange={set("name")} autoComplete="name" required />
              </Field>
              <Field label="Mobile number" required error={errors.phone} hint="We'll call this number before delivery">
                <Input value={form.phone} onChange={set("phone")} type="tel" inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" required />
              </Field>
              <Field label="Email (optional)" error={errors.email} hint="For the order confirmation">
                <Input value={form.email} onChange={set("email")} type="email" autoComplete="email" />
              </Field>
            </div>
          </Section>

          <Section step={2} title="Delivery address">
            {!!addresses?.length && (
              <div className="mb-4 flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => applyAddress(a)}
                    className={cn("rounded-lg border px-3 py-2 text-left text-xs transition hover:border-foreground", form.addressLine === a.addressLine && form.district === a.district && "border-primary ring-1 ring-primary")}
                  >
                    <span className="block font-semibold">{a.label}</span>
                    <span className="text-muted-foreground">{a.area}, {a.district}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="District" required error={errors.district}>
                <Select value={form.district} onChange={set("district")} required>
                  <option value="">Select district</option>
                  {shipping?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Area / Thana" required error={errors.area}>
                <Input value={form.area} onChange={set("area")} placeholder="e.g. Mirpur 10" required />
              </Field>
              <Field label="Full address" required error={errors.addressLine} className="sm:col-span-2" hint="House, road, block, nearby landmark">
                <Textarea value={form.addressLine} onChange={set("addressLine")} rows={2} autoComplete="street-address" required />
              </Field>
              <Field label="Order note (optional)" className="sm:col-span-2">
                <Input value={form.note} onChange={set("note")} placeholder="e.g. Please call before coming" />
              </Field>
            </div>
            {quote?.shipping && (
              <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
                Delivery to <strong>{form.district}</strong> ({quote.shipping.zone.name}):{" "}
                <strong>{quote.shipping.isFree ? "Free" : formatPrice(quote.shipping.charge)}</strong> · {quote.shipping.zone.estimatedDays}
              </p>
            )}
            {user && !addresses?.length && (
              <Checkbox className="mt-4" label="Save this address to my account" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
            )}
          </Section>

          <Section step={3} title="Payment">
            <PaymentOptions value={payment} onChange={setPayment} codEnabled={settings.codEnabled} onlineEnabled={settings.onlinePaymentEnabled} />
          </Section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <OrderSummary
            items={items}
            quote={quote ?? null}
            loading={quoting}
            couponCode={couponCode}
            onApplyCoupon={setCouponCode}
            onRemoveCoupon={() => setCouponCode("")}
          />
          {settings.checkoutNote && <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{settings.checkoutNote}</p>}
          {belowMinimum && <p className="text-sm text-sale">Minimum order amount is {formatPrice(settings.minOrderAmount)}.</p>}
          <Button type="submit" size="lg" className="h-13 w-full text-base" loading={placing} disabled={belowMinimum || !quote}>
            <Lock className="size-4" />
            {payment === "COD" ? "Place order" : "Continue to payment"} · {formatPrice(quote?.totals.total)}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By placing your order you agree to our <Link href="/pages/terms-conditions" className="underline">terms</Link> and{" "}
            <Link href="/pages/return-refund-policy" className="underline">return policy</Link>.
          </p>
        </div>
      </form>
    </div>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-3 font-sans text-lg font-semibold">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
