"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { authApi } from "@/services/shop";

/** Customer login & registration. Accounts live in our own database (phone or email + password). */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", identifier: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const { user } =
        mode === "login"
          ? await authApi.login(form.identifier, form.password)
          : await authApi.register({ name: form.name, phone: form.phone, email: form.email || undefined, password: form.password });
      setUser(user);
      toast.success(mode === "login" ? `Welcome back, ${user.name.split(" ")[0]}!` : "Your account is ready!");
      router.replace(next.startsWith("/") ? next : "/account");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
      setLoading(false);
    }
  };

  const nextQuery = next !== "/account" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Log in to track orders, save addresses and check out faster." : "Track orders, save addresses and get member-only offers."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border bg-card p-6 sm:p-8">
          {mode === "register" ? (
            <>
              <Field label="Full name" required error={errors.name}>
                <Input value={form.name} onChange={set("name")} autoComplete="name" required />
              </Field>
              <Field label="Mobile number" required error={errors.phone}>
                <Input value={form.phone} onChange={set("phone")} type="tel" inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" required />
              </Field>
              <Field label="Email (optional)" error={errors.email}>
                <Input value={form.email} onChange={set("email")} type="email" autoComplete="email" />
              </Field>
            </>
          ) : (
            <Field label="Mobile number or email" required error={errors.identifier}>
              <Input value={form.identifier} onChange={set("identifier")} autoComplete="username" required autoFocus />
            </Field>
          )}
          <Field label="Password" required error={errors.password} hint={mode === "register" ? "At least 6 characters" : undefined}>
            <Input value={form.password} onChange={set("password")} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New here? <Link href={`/register${nextQuery}`} className="font-medium text-foreground underline underline-offset-4">Create an account</Link></>
          ) : (
            <>Already have an account? <Link href={`/login${nextQuery}`} className="font-medium text-foreground underline underline-offset-4">Log in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
