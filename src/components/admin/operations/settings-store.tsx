"use client";

import type { ReactNode } from "react";
import { ImageField } from "@/components/admin/image-picker";
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from "@/components/shared/social-icons";
import { Field, Input, Textarea } from "@/components/ui/form";
import type { StoreSettings } from "@/types";
import { SettingsSection, useSettingForm, type SettingsTabProps } from "./settings-shared";

const SOCIAL: { key: keyof StoreSettings["social"]; label: string; icon: ReactNode; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", icon: <FacebookIcon className="size-4" />, placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", icon: <InstagramIcon className="size-4" />, placeholder: "https://instagram.com/yourshop" },
  { key: "youtube", label: "YouTube", icon: <YoutubeIcon className="size-4" />, placeholder: "https://youtube.com/@yourshop" },
  { key: "tiktok", label: "TikTok", icon: <TiktokIcon className="size-4" />, placeholder: "https://tiktok.com/@yourshop" },
];

/** Store identity: name, logos, contact details, announcement bar, footer and social links. */
export function StoreSettingsTab(props: SettingsTabProps<"store">) {
  const { form, set, errors, saving, dirty, save, reset } = useSettingForm("store", props);

  return (
    <SettingsSection title="Store" description="Your brand and contact details, shown in the header, footer and invoices." onSubmit={save} saving={saving} dirty={dirty} canSave={props.canSave} onReset={reset}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Store name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
        </Field>
        <Field label="Tagline" error={errors.tagline}>
          <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={160} />
        </Field>

        <Field label="Logo" hint="PNG or SVG with a transparent background, about 400×120">
          <ImageField value={form.logo} onChange={(url) => set("logo", url ?? "")} folder="brand" aspect="aspect-[3/1]" label="Upload logo" />
        </Field>
        <Field label="Logo for dark mode" hint="Light version for dark backgrounds (optional)">
          {/* Always-dark swatch so a light logo is visible in both themes. */}
          <div className="rounded-lg bg-[#111] p-1">
            <ImageField value={form.logoDark} onChange={(url) => set("logoDark", url ?? "")} folder="brand" aspect="aspect-[3/1]" label="Upload dark logo" />
          </div>
        </Field>
        <Field label="Favicon" hint="Square, at least 64×64">
          <div className="w-24">
            <ImageField value={form.favicon} onChange={(url) => set("favicon", url ?? "")} folder="brand" aspect="aspect-square" label="Icon" />
          </div>
        </Field>
        <div className="hidden sm:block" />

        <Field label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
        </Field>
        <Field label="WhatsApp number" error={errors.whatsapp} hint="With country code, e.g. 8801700000000">
          <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} inputMode="tel" />
        </Field>
        <Field label="Address" error={errors.address}>
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} maxLength={300} />
        </Field>

        <Field label="Announcement bar" error={errors.announcement} hint="Thin bar above the header. Leave empty to hide it." className="sm:col-span-2">
          <Input value={form.announcement} onChange={(e) => set("announcement", e.target.value)} maxLength={200} placeholder="Free delivery on orders over ৳3,000" />
        </Field>
        <Field label="Footer about text" error={errors.footerAbout} className="sm:col-span-2">
          <Textarea rows={3} value={form.footerAbout} onChange={(e) => set("footerAbout", e.target.value)} maxLength={600} />
        </Field>

        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">Social links</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL.map((s) => (
              <label key={s.key} className="flex items-center gap-2 rounded-md border border-input bg-background pl-3 focus-within:border-foreground">
                <span className="text-muted-foreground" title={s.label}>{s.icon}</span>
                <input
                  value={form.social[s.key]}
                  onChange={(e) => set("social", { ...form.social, [s.key]: e.target.value })}
                  placeholder={s.placeholder}
                  aria-label={s.label}
                  className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm focus:outline-none"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
