"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { errorMessage } from "@/lib/api/client";
import { authApi } from "@/services/shop";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.adminLogin(identifier, password);
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <LockKeyhole className="size-5" />
          </span>
          <h1 className="font-sans text-xl font-semibold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage products, orders and your store.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email or phone" htmlFor="identifier">
            <Input id="identifier" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
