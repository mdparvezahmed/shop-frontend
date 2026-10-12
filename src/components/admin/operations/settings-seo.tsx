"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ImageField } from "@/components/admin/image-picker";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SITE_URL } from "@/config/site";
import { cn } from "@/lib/utils";
import { SettingsSection, useSettingForm, type SettingsTabProps } from "./settings-shared";

/** Default SEO tags, social share image and tracking IDs. */
export function SeoSettingsTab(props: SettingsTabProps<"seo">) {
  const { form, set, errors, saving, dirty, save, reset } = useSettingForm("seo", props);
  const [keyword, setKeyword] = useState("");

  const addKeyword = () => {
    const parts = keyword.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
    if (parts.length) set("keywords", [...new Set([...form.keywords, ...parts])]);
    setKeyword("");
  };

  return (
    <SettingsSection title="SEO" description="Defaults for search engines and social sharing. Products, menus and pages can override them." onSubmit={save} saving={saving} dirty={dirty} canSave={props.canSave} onReset={reset}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-3 sm:col-span-2">
          <p className="text-xs text-muted-foreground">{SITE_URL.replace(/^https?:\/\//, "")}</p>
          <p className="mt-0.5 line-clamp-1 text-base text-sky-700 dark:text-sky-400">{form.title || "Home page title"}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{form.description || "Meta description"}</p>
        </div>
        <Field label={<Counted label="Home page title" value={form.title} ideal={60} />} error={errors.title} className="sm:col-span-2">
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} />
        </Field>
        <Field label="Title suffix" error={errors.titleSuffix} hint={`Other pages: “Polo Shirts | ${form.titleSuffix || "Store"}”`}>
          <Input value={form.titleSuffix} onChange={(e) => set("titleSuffix", e.target.value)} maxLength={60} />
        </Field>
        <div className="hidden sm:block" />
        <Field label={<Counted label="Meta description" value={form.description} ideal={160} />} error={errors.description} className="sm:col-span-2">
          <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={300} />
        </Field>

        <Field label="Keywords" error={errors.keywords} hint="Press Enter or comma to add" className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5 focus-within:border-foreground">
            {form.keywords.map((k) => (
              <span key={k} className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pr-1 pl-2.5 text-xs">
                {k}
                <button type="button" onClick={() => set("keywords", form.keywords.filter((x) => x !== k))} className="rounded-full p-0.5 hover:bg-border" aria-label={`Remove ${k}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addKeyword();
                } else if (e.key === "Backspace" && !keyword && form.keywords.length) {
                  set("keywords", form.keywords.slice(0, -1));
                }
              }}
              onBlur={addKeyword}
              placeholder={form.keywords.length ? "" : "t-shirt, polo, bangladesh"}
              className="h-7 min-w-32 flex-1 bg-transparent px-1.5 text-sm focus:outline-none"
            />
          </div>
        </Field>

        <Field label="Social share image" hint="Shown when the site is shared on Facebook/WhatsApp — 1200×630" className="sm:col-span-2">
          <div className="max-w-md">
            <ImageField value={form.ogImage} onChange={(url) => set("ogImage", url ?? "")} folder="brand" aspect="aspect-[1200/630]" label="Upload share image" />
          </div>
        </Field>

        <Field label="Google site verification" error={errors.googleVerification} hint="Only the content value of the meta tag" className="sm:col-span-2">
          <Input value={form.googleVerification} onChange={(e) => set("googleVerification", e.target.value)} className="font-mono" />
        </Field>
        <Field label="Facebook Pixel ID" error={errors.facebookPixelId}>
          <Input value={form.facebookPixelId} onChange={(e) => set("facebookPixelId", e.target.value)} className="font-mono" placeholder="123456789012345" />
        </Field>
        <Field label="Google Analytics ID" error={errors.googleAnalyticsId}>
          <Input value={form.googleAnalyticsId} onChange={(e) => set("googleAnalyticsId", e.target.value)} className="font-mono" placeholder="G-XXXXXXXXXX" />
        </Field>
      </div>
    </SettingsSection>
  );
}

function Counted({ label, value, ideal }: { label: string; value: string; ideal: number }) {
  return (
    <span className="flex justify-between gap-2">
      {label}
      <span className={cn("text-xs font-normal tabular-nums", value.length > ideal ? "text-warning" : "text-muted-foreground")}>{value.length}/{ideal}</span>
    </span>
  );
}
