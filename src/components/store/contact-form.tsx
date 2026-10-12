"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ApiError, errorMessage } from "@/lib/api/client";
import { engagementApi } from "@/services/shop";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await engagementApi.contact({ ...form, email: form.email || undefined, phone: form.phone || undefined, subject: form.subject || undefined });
      toast.success(res.message);
      setForm(EMPTY);
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-6 sm:grid-cols-2 sm:p-8">
      <Field label="Name" required error={errors.name} className="sm:col-span-2"><Input value={form.name} onChange={set("name")} required /></Field>
      <Field label="Email" error={errors.email}><Input type="email" value={form.email} onChange={set("email")} /></Field>
      <Field label="Phone" error={errors.phone}><Input type="tel" value={form.phone} onChange={set("phone")} /></Field>
      <Field label="Subject" error={errors.subject} className="sm:col-span-2"><Input value={form.subject} onChange={set("subject")} /></Field>
      <Field label="Message" required error={errors.message} className="sm:col-span-2"><Textarea rows={5} value={form.message} onChange={set("message")} required /></Field>
      <Button type="submit" size="lg" loading={loading} className="sm:col-span-2">Send message</Button>
    </form>
  );
}
