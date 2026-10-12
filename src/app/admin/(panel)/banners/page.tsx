"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ExternalLink, ImageIcon, Pencil, Plus, Smartphone, Trash2 } from "lucide-react";
import { FilterTabs } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { BannerForm, bannerBody } from "@/components/admin/operations/banner-form";
import { isForbidden } from "@/components/admin/operations/helpers";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { AdminBanner, BannerPlacement, BannerSizes } from "@/types/admin-operations";

const PLACEMENT_INFO: Record<BannerPlacement, string> = {
  HERO: "The full-width slider at the top of the home page.",
  PROMO: "Wide promotional strips between home page sections.",
};

/** Home page banners — hero slider and promo strips. */
export default function BannersPage() {
  const { data, isLoading, mutate } = useSWR<{ items: AdminBanner[]; sizes: BannerSizes }>("/admin/banners");
  const [placement, setPlacement] = useState<BannerPlacement>("HERO");
  const [editing, setEditing] = useState<AdminBanner | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminBanner | null>(null);
  const [busy, setBusy] = useState(false);

  const all = data?.items ?? [];
  const banners = all.filter((b) => b.placement === placement).sort((a, b) => a.sortOrder - b.sortOrder);
  const size = data?.sizes[placement];

  const toggle = async (b: AdminBanner, isActive: boolean) => {
    mutate({ items: all.map((x) => (x.id === b.id ? { ...x, isActive } : x)), sizes: data!.sizes }, { revalidate: false });
    try {
      await api.put(`/admin/banners/${b.id}`, bannerBody({ ...b, isActive }));
      toast.success(isActive ? "Banner is live" : "Banner hidden");
    } catch (e) {
      toast.error(isForbidden(e) ? "Only a manager or the owner can change banners." : errorMessage(e));
    } finally {
      mutate();
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/banners/${deleting.id}`);
      toast.success("Banner deleted");
      setDeleting(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Banners"
        description="Images and offers on the home page."
        actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> New banner</Button>}
      />

      <FilterTabs<BannerPlacement>
        value={placement}
        onChange={(v) => setPlacement(v || "HERO")}
        options={[
          { value: "HERO", label: "Hero slider", count: all.filter((b) => b.placement === "HERO").length },
          { value: "PROMO", label: "Promo strips", count: all.filter((b) => b.placement === "PROMO").length },
        ]}
      />
      <p className="-mt-1 mb-4 text-sm text-muted-foreground">
        {PLACEMENT_INFO[placement]}
        {size && <> Recommended size: desktop {size.desktop}, mobile {size.mobile} px.</>}
      </p>

      {isLoading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
      ) : banners.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ImageIcon className="size-6" />}
            title={placement === "HERO" ? "No hero banners" : "No promo banners"}
            description="Add a banner to highlight a collection or offer."
            action={<Button onClick={() => setEditing("new")}>Add banner</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((b) => (
            <Card key={b.id} className={cn("overflow-hidden", !b.isActive && "opacity-75")}>
              <div className="relative aspect-[5/2] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt={b.title} className="size-full object-cover" loading="lazy" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <Badge tone="dark">#{b.sortOrder}</Badge>
                  {b.mobileImage && <Badge tone="dark"><Smartphone className="size-3" /> Mobile image</Badge>}
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="font-semibold">{b.title}</h3>
                  {b.subtitle && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{b.subtitle}</p>}
                </div>
                {(b.buttonText || b.link) && (
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {b.buttonText && <span className="rounded border px-2 py-0.5 font-medium text-foreground">{b.buttonText}</span>}
                    {b.link && (
                      <a href={b.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate hover:text-foreground hover:underline">
                        {b.link} <ExternalLink className="size-3" />
                      </a>
                    )}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 border-t pt-3">
                  <Switch checked={b.isActive} onChange={(v) => toggle(b, v)} label={b.isActive ? "Active" : "Hidden"} />
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditing(b)} aria-label="Edit"><Pencil className="size-4" /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(b)} aria-label="Delete"><Trash2 className="size-4 text-sale" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BannerForm
        banner={editing === "new" ? null : editing}
        placement={placement}
        sizes={data?.sizes}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          mutate();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this banner?"
        message={`“${deleting?.title}” will be removed from the home page.`}
      />
    </>
  );
}
