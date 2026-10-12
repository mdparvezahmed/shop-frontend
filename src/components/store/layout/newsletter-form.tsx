"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/client";
import { engagementApi } from "@/services/shop";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await engagementApi.subscribe(email);
      toast.success(res.message);
      setEmail("");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-4 text-sm focus:border-foreground focus:outline-none"
      />
      <Button type="submit" size="lg" className="h-11" loading={loading}>Subscribe</Button>
    </form>
  );
}
