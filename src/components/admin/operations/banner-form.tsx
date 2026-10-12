"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageField } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import type { AdminBanner, BannerPlacement, BannerSizes } from "@/types/admin-operations";

const EMPTY = {
  title: "",
  subtitle: "",
  buttonText: "",
  link: "",
  image: "",
  mobileImage: "",
  placement: "HERO" as BannerPlacement,
  sortOrder: "0",
  isActive: true,
};

/** Body for POST/PUT /admin/banners — empty optional text becomes null. */
export function bannerBody(b: Pick<AdminBanner, "title" | "placement" | "isActive"> & Partial<AdminBanner>) {
  return {
    title: b.title,
    subtitle: b.subtitle || null,
    buttonText: b.buttonText || null,
    link: b.link || null,
    image: b.image ?? "",
    mobileImage: b.mobileImage || null,
    placement: b.placement,
    sortOrder: Number(b.sortOrder ?? 0),
    isActive: b.isActive,
  };
}

/** Create / edit a home page banner. */
export function BannerForm({
  banner,
  placement,
  sizes,
  open,
  onClose,
  onSaved,
}: {
  banner: AdminBanner | null;
  placement: BannerPlacement;
  sizes?: BannerSizes;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      banner
        ? {
            title: banner.title,
            subtitle: banner.subtitle ?? "",
            buttonText: banner.buttonText ?? "",
            link: banner.link ?? "",
            image: banner.image,
            mobileImage: banner.mobileImage ?? "",
            placement: banner.placement,
            sortOrder: String(banner.sortOrder),
            isActive: banner.isActive,
          }
        : { ...EMPTY, placement },
    );
  }, [open, banner, placement]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const size = sizes?.[form.placement];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = bannerBody({ ...form, sortOrder: Number(form.sortOrder || 0) });
    try {
      if (banner) await api.put(`/admin/banners/${banner.id}`, body);
      else await api.post("/admin/banners", body);
      toast.success(banner ? "Banner updated" : "Banner created");
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={banner ? "Edit banner" : "New banner"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="banner-form" loading={saving}>Save banner</Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Desktop image" required error={errors.image} hint={size ? `Recommended ${size.desktop} px` : undefined} className="sm:col-span-2">
          <ImageField value={form.image} onChange={(url) => set("image", url ?? "")} folder="banners" aspect="aspect-[5/2]" label="Upload desktop image" />
        </Field>
        <Field label="Mobile image" error={errors.mobileImage} hint={size ? `Optional · recommended ${size.mobile} px` : "Optional"}>
          <ImageField value={form.mobileImage} onChange={(url) => set("mobileImage", url ?? "")} folder="banners" aspect="aspect-[4/5]" label="Upload mobile image" />
        </Field>
        <div className="space-y-4">
          <Field label="Placement" required>
            <Select value={form.placement} onChange={(e) => set("placement", e.target.value as BannerPlacement)}>
              <option value="HERO">Hero slider (top of home page)</option>
              <option value="PROMO">Promo strip (between sections)</option>
            </Select>
          </Field>
          <Field label="Title" required error={errors.title}>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="Polo Week — Up to 20% Off" />
          </Field>
          <Field label="Subtitle" error={errors.subtitle}>
            <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={250} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button text" error={errors.buttonText}>
              <Input value={form.buttonText} onChange={(e) => set("buttonText", e.target.value)} maxLength={40} placeholder="Shop now" />
            </Field>
            <Field label="Sort order" error={errors.sortOrder}>
              <Input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </Field>
          </div>
          <Field label="Link" error={errors.link} hint="e.g. /collections/polo-shirts">
            <Input value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="/collections/…" />
          </Field>
          <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active" description="Show this banner on the home page" />
        </div>
      </form>
    </Modal>
  );
}
