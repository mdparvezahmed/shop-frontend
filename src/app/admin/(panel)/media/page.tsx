"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, ImageIcon, Pencil, Trash2, Upload } from "lucide-react";
import { FilterTabs, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { uploadImages } from "@/components/admin/image-picker";
import { MediaDetails, copyMediaUrl, formatBytes } from "@/components/admin/catalog/media-details";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { EmptyState, Pagination, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api/client";
import { MEDIA_FOLDERS, type MediaFolder, type MediaRecord } from "@/types/admin-catalog";

const FOLDER_LABELS: Record<MediaFolder, string> = {
  products: "Products",
  menus: "Menus",
  banners: "Banners",
  pages: "Pages",
  brand: "Brand",
  general: "General",
};

/**
 * Media library — every uploaded image. Uploads are resized and converted to WebP by the API.
 */
export default function MediaPage() {
  const list = useAdminList<MediaRecord>("/admin/media", { q: "", folder: "" }, { limit: 40 });
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>("general");
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<MediaRecord | null>(null);
  const [deleting, setDeleting] = useState<MediaRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadImages([...files], uploadFolder);
      toast.success(`${uploaded.length} image(s) uploaded`);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/media/${deleting.id}`);
      toast.success("Image deleted");
      setDeleting(null);
      setViewing(null);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const folder = (list.filters.folder as MediaFolder | "") ?? "";

  return (
    <>
      <PageHeader
        title="Media library"
        description="All uploaded images. Write alt text so images help your Google ranking."
        actions={
          <>
            <Select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value as MediaFolder)} className="w-36" aria-label="Upload to folder">
              {MEDIA_FOLDERS.map((f) => (
                <option key={f} value={f}>To: {FOLDER_LABELS[f]}</option>
              ))}
            </Select>
            <Button onClick={() => inputRef.current?.click()} loading={uploading}>
              {!uploading && <Upload className="size-4" />} Upload images
            </Button>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </>
        }
      />

      <FilterTabs<MediaFolder>
        value={folder}
        onChange={(v) => {
          list.setFilter("folder", v);
          if (v) setUploadFolder(v);
        }}
        options={[{ value: "", label: "All" }, ...MEDIA_FOLDERS.map((f) => ({ value: f, label: FOLDER_LABELS[f] }))]}
      />
      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => list.setFilter("q", q)} placeholder="Search file name or alt text…" />

      {list.isLoading && !list.items ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : !list.items?.length ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={<ImageIcon className="size-6" />}
            title={list.filters.q || folder ? "No images match" : "No images yet"}
            description="Upload JPG, PNG or WebP images (max 8 MB each, up to 20 at a time)."
            action={<Button onClick={() => inputRef.current?.click()}>Upload images</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {list.items.map((item) => (
            <div key={item.id} className="group overflow-hidden rounded-lg border bg-card">
              <button type="button" onClick={() => setViewing(item)} className="relative block aspect-square w-full bg-muted" title={item.filename}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt ?? ""} className="size-full object-cover" loading="lazy" />
                {!item.alt && <span className="absolute bottom-1.5 left-1.5 rounded bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold text-warning">No alt text</span>}
              </button>
              <div className="flex items-center gap-1 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" title={item.filename}>{item.filename}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(item.size)}
                    {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                  </p>
                </div>
                <button type="button" onClick={() => copyMediaUrl(item.url)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Copy URL" title="Copy URL">
                  <Copy className="size-3.5" />
                </button>
                <button type="button" onClick={() => setViewing(item)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit alt text" title="Edit alt text">
                  <Pencil className="size-3.5" />
                </button>
                <button type="button" onClick={() => setDeleting(item)} className="rounded p-1.5 text-sale hover:bg-muted" aria-label="Delete" title="Delete">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {list.meta && list.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={list.meta.page} totalPages={list.meta.totalPages} onChange={list.setPage} />
        </div>
      )}

      <MediaDetails
        item={viewing}
        onClose={() => setViewing(null)}
        onSaved={() => {
          setViewing(null);
          list.reload();
        }}
        onDelete={setDeleting}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this image?"
        message="The file is removed from the server. Any product, banner or page still using its URL will show a broken image."
      />
    </>
  );
}
