"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageField } from "@/components/admin/image-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import { slugify } from "@/lib/utils";
import type { AdminMenu, MenuType } from "@/types/admin-catalog";
import { LabelWithCount } from "./char-count";
import { descendantIds, flattenMenus, indentedLabel } from "./menu-tree";

const EMPTY = {
  name: "",
  slug: "",
  type: "COLLECTION" as MenuType,
  url: "",
  parentId: "",
  image: null as string | null,
  bannerImage: null as string | null,
  description: "",
  isActive: true,
  showInHeader: true,
  showInFooter: false,
  showOnHome: false,
  homeSection: false,
  seoTitle: "",
  seoDescription: "",
};

type MenuFormState = typeof EMPTY;

/** What the modal is doing: editing a menu, or creating one (optionally under a parent). */
export type MenuEditorTarget = { menu: AdminMenu } | { parentId: string | null };

/**
 * Create/edit a menu or sub-menu. Collections get their own page at /collections/{slug};
 * links just point somewhere (e.g. /shop?onSale=true).
 */
export function MenuForm({
  target,
  tree,
  onClose,
  onSaved,
}: {
  target: MenuEditorTarget | null;
  tree: AdminMenu[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = target && "menu" in target ? target.menu : null;
  const [form, setForm] = useState<MenuFormState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setErrors({});
    if ("menu" in target) {
      const m = target.menu;
      setSlugTouched(true);
      setForm({
        name: m.name,
        slug: m.slug,
        type: m.type,
        url: m.url ?? "",
        parentId: m.parentId ?? "",
        image: m.image,
        bannerImage: m.bannerImage,
        description: m.description ?? "",
        isActive: m.isActive,
        showInHeader: m.showInHeader,
        showInFooter: m.showInFooter,
        showOnHome: m.showOnHome,
        homeSection: m.homeSection,
        seoTitle: m.seoTitle ?? "",
        seoDescription: m.seoDescription ?? "",
      });
    } else {
      setSlugTouched(false);
      setForm({ ...EMPTY, parentId: target.parentId ?? "", showInHeader: true });
    }
  }, [target]);

  /** Parent options: every menu except this one and its own sub-menus (that would make a loop). */
  const parentOptions = useMemo(() => {
    const blocked = editing ? new Set([editing.id, ...descendantIds(editing)]) : new Set<string>();
    return flattenMenus(tree).filter((f) => !blocked.has(f.menu.id));
  }, [tree, editing]);

  const set = <K extends keyof MenuFormState>(key: K, value: MenuFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // The update endpoint does not re-check this, so guard it here for both create and edit.
    if (form.type === "LINK" && !form.url.trim()) {
      setErrors({ url: ["A link menu needs a URL"] });
      return;
    }
    setSaving(true);
    setErrors({});
    const parentId = form.parentId || null;
    const body = {
      ...form,
      slug: form.slug || undefined,
      url: form.type === "LINK" ? form.url : null,
      parentId,
      description: form.description || null,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
    };
    try {
      if (editing) {
        await api.patch(`/admin/menus/${editing.id}`, body);
      } else {
        // New menus go to the end of their siblings.
        const siblings = parentId ? (flattenMenus(tree).find((f) => f.menu.id === parentId)?.menu.children ?? []) : tree;
        const sortOrder = siblings.reduce((max, m) => Math.max(max, m.sortOrder + 1), 0);
        await api.post("/admin/menus", { ...body, sortOrder });
      }
      toast.success(editing ? "Menu updated" : "Menu created");
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const isLink = form.type === "LINK";

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      size="lg"
      title={editing ? `Edit ${editing.name}` : form.parentId ? "New sub-menu" : "New menu"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="menu-form" loading={saving}>Save menu</Button>
        </>
      }
    >
      <form id="menu-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))}
            placeholder="Graphic Tees"
            maxLength={80}
            autoFocus
          />
        </Field>
        <Field label="Slug" error={errors.slug} hint={isLink ? "Used internally" : `/collections/${form.slug || "…"}`}>
          <Input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
            }}
            className="font-mono text-xs"
            maxLength={80}
          />
        </Field>
        <Field label="Type" error={errors.type}>
          <Select value={form.type} onChange={(e) => set("type", e.target.value as MenuType)}>
            <option value="COLLECTION">Collection — has its own product page</option>
            <option value="LINK">Link — points to a URL</option>
          </Select>
        </Field>
        <Field label="Parent menu" error={errors.parentId} hint="Leave as top level for a main menu item">
          <Select value={form.parentId} onChange={(e) => set("parentId", e.target.value)}>
            <option value="">— Top level —</option>
            {parentOptions.map((f) => (
              <option key={f.menu.id} value={f.menu.id}>{indentedLabel(f)}</option>
            ))}
          </Select>
        </Field>
        {isLink && (
          <Field label="URL" required error={errors.url} hint="A page on this site (/shop?onSale=true) or a full https:// link" className="sm:col-span-2">
            <Input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="/shop?newArrival=true" maxLength={300} />
          </Field>
        )}

        <Field label="Image" error={errors.image} hint="Square, used for the category tile on the home page">
          <ImageField value={form.image} onChange={(url) => set("image", url)} folder="menus" aspect="aspect-square" />
        </Field>
        <Field label="Banner image" error={errors.bannerImage} hint="Wide image at the top of the collection page">
          <ImageField value={form.bannerImage} onChange={(url) => set("bannerImage", url)} folder="menus" aspect="aspect-[3/1]" label="Upload banner" />
        </Field>

        {!isLink && (
          <Field label="Description" error={errors.description} hint="Shown on the collection page — a few helpful paragraphs are good for SEO." className="sm:col-span-2">
            <RichTextEditor value={form.description} onChange={(html) => set("description", html)} placeholder="Introduce this collection…" />
          </Field>
        )}

        <div className="space-y-3 rounded-lg border p-4 sm:col-span-2">
          <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active" description="Hidden menus are not shown anywhere on the store" />
          <Switch checked={form.showInHeader} onChange={(v) => set("showInHeader", v)} label="Show in header" description="Top navigation (sub-menus appear in the dropdown)" />
          <Switch checked={form.showInFooter} onChange={(v) => set("showInFooter", v)} label="Show in footer" />
          <Switch checked={form.showOnHome} onChange={(v) => set("showOnHome", v)} label="Home tile" description="Category tile on the home page (uses the image)" />
          <Switch checked={form.homeSection} onChange={(v) => set("homeSection", v)} label="Home section" description="Product row on the home page" />
        </div>

        {!isLink && (
          <>
            <Field label={<LabelWithCount label="SEO title" length={form.seoTitle.length} ideal={60} min={20} />} error={errors.seoTitle} hint="Empty = menu name" className="sm:col-span-2">
              <Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={120} placeholder={`${form.name || "Graphic Tees"} – Buy Online in Bangladesh`} />
            </Field>
            <Field label={<LabelWithCount label="SEO description" length={form.seoDescription.length} ideal={160} min={70} />} error={errors.seoDescription} className="sm:col-span-2">
              <Textarea rows={2} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={300} placeholder="Shop graphic t-shirts online in Bangladesh. Premium cotton, cash on delivery." />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
