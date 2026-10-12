"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Input } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/**
 * Image fields for admin forms.
 *
 *   <ImageField value={url} onChange={setUrl} folder="banners" />            single image
 *   <ImageGallery value={images} onChange={setImages} folder="products" />   many, ordered, with alt text
 *
 * Both can upload new files (resized to WebP by the API) or pick from the media library.
 */

export type MediaItem = { id: string; url: string; filename: string; alt: string | null; width: number | null; height: number | null; createdAt: string };
export type GalleryImage = { url: string; alt: string | null; colorId?: string | null };
type Folder = "products" | "menus" | "banners" | "pages" | "brand" | "general";

export async function uploadImages(files: File[], folder: Folder) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  form.append("folder", folder);
  return api.upload<MediaItem[]>("/admin/media", form);
}

/** Modal listing the media library; returns the chosen URLs. */
export function MediaLibraryModal({
  open,
  onClose,
  onSelect,
  multiple,
  folder,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  folder: Folder;
}) {
  const [picked, setPicked] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, mutate, isLoading } = useSWR<MediaItem[]>(open ? "/admin/media?limit=100" : null);

  const toggle = (item: MediaItem) =>
    setPicked((p) => (p.some((x) => x.id === item.id) ? p.filter((x) => x.id !== item.id) : multiple ? [...p, item] : [item]));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadImages([...files], folder);
      await mutate();
      setPicked((p) => (multiple ? [...p, ...uploaded] : uploaded.slice(0, 1)));
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Media library"
      description="Upload new images or choose existing ones."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!picked.length}
            onClick={() => {
              onSelect(picked);
              setPicked([]);
              onClose();
            }}
          >
            Use {picked.length > 1 ? `${picked.length} images` : "image"}
          </Button>
        </>
      }
    >
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => onFiles(e.target.files)} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mb-4 flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm text-muted-foreground transition hover:border-foreground hover:text-foreground"
      >
        {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
        {uploading ? "Uploading…" : "Click to upload (JPG, PNG, WebP — max 8 MB each)"}
      </button>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {data?.map((item) => {
            const active = picked.some((p) => p.id === item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item)}
                className={cn("relative aspect-square overflow-hidden rounded-lg border-2 bg-muted", active ? "border-primary" : "border-transparent")}
                title={item.filename}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt ?? ""} className="size-full object-cover" loading="lazy" />
                {active && (
                  <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/** Single image (logo, banner, category image). */
export function ImageField({
  value,
  onChange,
  folder = "general",
  aspect = "aspect-video",
  label = "Upload image",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: Folder;
  aspect?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {value ? (
        <div className={cn("group relative overflow-hidden rounded-lg border bg-muted", aspect)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Change</Button>
            <Button size="sm" variant="danger" onClick={() => onChange(null)}>Remove</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn("flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:border-foreground hover:text-foreground", aspect)}
        >
          <ImagePlus className="size-6" />
          {label}
        </button>
      )}
      <MediaLibraryModal open={open} onClose={() => setOpen(false)} folder={folder} onSelect={(items) => onChange(items[0]?.url ?? null)} />
    </div>
  );
}

/** Ordered list of images with alt text (product gallery). First image = main image. */
export function ImageGallery({
  value,
  onChange,
  folder = "products",
  colors,
}: {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  folder?: Folder;
  /** When given, each image can be tied to a colour */
  colors?: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const update = (i: number, patch: Partial<GalleryImage>) => onChange(value.map((img, idx) => (idx === i ? { ...img, ...patch } : img)));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((img, i) => (
          <div key={`${img.url}-${i}`} className="overflow-hidden rounded-lg border bg-card">
            <div className="relative aspect-[4/5] bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ""} className="size-full object-cover" />
              {i === 0 && <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase">Main</span>}
              <div className="absolute top-2 right-2 flex gap-1">
                <button type="button" onClick={() => move(i, i - 1)} className="rounded bg-card/90 p-1 hover:bg-card" aria-label="Move left"><ArrowLeft className="size-3.5" /></button>
                <button type="button" onClick={() => move(i, i + 1)} className="rounded bg-card/90 p-1 hover:bg-card" aria-label="Move right"><ArrowRight className="size-3.5" /></button>
                <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="rounded bg-card/90 p-1 text-sale hover:bg-card" aria-label="Remove"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
            <div className="space-y-1.5 p-2">
              <Input className="h-8 text-xs" placeholder="Alt text (describe the photo)" value={img.alt ?? ""} onChange={(e) => update(i, { alt: e.target.value })} />
              {colors && colors.length > 0 && (
                <select className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={img.colorId ?? ""} onChange={(e) => update(i, { colorId: e.target.value || null })}>
                  <option value="">Any colour</option>
                  {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          <ImagePlus className="size-6" />
          Add images
        </button>
      </div>
      <MediaLibraryModal
        open={open}
        onClose={() => setOpen(false)}
        folder={folder}
        multiple
        onSelect={(items) => onChange([...value, ...items.map((m) => ({ url: m.url, alt: m.alt, colorId: null }))])}
      />
    </div>
  );
}
