"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Switch, Textarea } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import { absoluteUrl, cn, plainText, slugify } from "@/lib/utils";
import type { CmsPage } from "@/types/admin-operations";

const EMPTY = { title: "", slug: "", content: "", seoTitle: "", seoDescription: "", isPublished: true, showInFooter: true };

/** Character counter that turns amber past the recommended length. */
function Counter({ value, ideal }: { value: string; ideal: number }) {
  return <span className={cn("tabular-nums", value.length > ideal ? "text-warning" : "text-muted-foreground")}>{value.length}/{ideal}</span>;
}

/** Create / edit a content page (About, Privacy Policy, FAQ …) shown at /pages/{slug}. */
export function PageEditor({ page, onSaved }: { page: CmsPage | null; onSaved?: (page: CmsPage) => void }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(
      page
        ? {
            title: page.title,
            slug: page.slug,
            content: page.content,
            seoTitle: page.seoTitle ?? "",
            seoDescription: page.seoDescription ?? "",
            isPublished: page.isPublished,
            showInFooter: page.showInFooter,
          }
        : EMPTY,
    );
    setSlugTouched(!!page);
  }, [page]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setTitle = (title: string) => setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));

  const previewTitle = form.seoTitle || form.title || "Page title";
  const previewDescription = form.seoDescription || plainText(form.content, 160) || "Add a meta description so Google shows a helpful snippet.";
  const slug = form.slug || slugify(form.title);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = { ...form, slug, seoTitle: form.seoTitle.trim() || null, seoDescription: form.seoDescription.trim() || null };
    try {
      if (page) {
        onSaved?.(await api.put<CmsPage>(`/admin/pages/${page.id}`, body));
        toast.success("Page saved");
      } else {
        const created = await api.post<CmsPage>("/admin/pages", body);
        toast.success("Page created");
        router.replace(`/admin/pages/${created.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!page) return;
    setBusy(true);
    try {
      await api.delete(`/admin/pages/${page.id}`);
      toast.success("Page deleted");
      router.replace("/admin/pages");
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save}>
      <PageHeader
        backHref="/admin/pages"
        backLabel="All pages"
        title={page ? `Edit “${page.title}”` : "New page"}
        actions={
          <>
            {page && (
              <>
                <ButtonLink href={`/pages/${page.slug}`} target="_blank" variant="outline">
                  View <ExternalLink className="size-3.5" />
                </ButtonLink>
                <Button variant="ghost" onClick={() => setDeleting(true)} aria-label="Delete page"><Trash2 className="size-4 text-sale" /></Button>
              </>
            )}
            <Button type="submit" loading={saving}>{page ? "Save page" : "Create page"}</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4 p-5">
            <Field label="Title" required error={errors.title}>
              <Input value={form.title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Refund Policy" />
            </Field>
            <Field label="URL" error={errors.slug} hint="Lowercase letters, numbers and dashes">
              <div className="flex items-center rounded-md border border-input bg-background focus-within:border-foreground">
                <span className="pl-3 text-sm whitespace-nowrap text-muted-foreground">/pages/</span>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  }}
                  placeholder={slugify(form.title) || "refund-policy"}
                  className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Content" error={errors.content}>
              <RichTextEditor value={form.content} onChange={(html) => set("content", html)} placeholder="Write the page… Use headings and lists to keep it easy to scan." />
            </Field>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Visibility" />
            <div className="space-y-4 px-5 py-4">
              <Switch checked={form.isPublished} onChange={(v) => set("isPublished", v)} label="Published" description="Draft pages return 404 on the store." />
              <Switch checked={form.showInFooter} onChange={(v) => set("showInFooter", v)} label="Show in footer" description="Adds a link in the site footer." />
            </div>
          </Card>

          <Card>
            <CardHeader title="Search engine listing" description="How the page can look on Google." />
            <div className="space-y-4 px-5 py-4">
              <div className="rounded-lg border bg-background p-3">
                <p className="truncate text-xs text-muted-foreground">{absoluteUrl(`/pages/${slug || "…"}`)}</p>
                <p className="mt-0.5 line-clamp-1 text-base text-sky-700 dark:text-sky-400">{previewTitle}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{previewDescription}</p>
              </div>
              <Field label={<span className="flex justify-between">SEO title <Counter value={form.seoTitle} ideal={60} /></span>} error={errors.seoTitle} hint="Empty = page title">
                <Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={120} />
              </Field>
              <Field
                label={<span className="flex justify-between">Meta description <Counter value={form.seoDescription} ideal={160} /></span>}
                error={errors.seoDescription}
                hint="Empty = start of the content"
              >
                <Textarea rows={3} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={300} />
              </Field>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={remove}
        loading={busy}
        title={`Delete “${page?.title}”?`}
        message="The page and its footer link are removed. Links to it will show “page not found”."
      />
    </form>
  );
}
