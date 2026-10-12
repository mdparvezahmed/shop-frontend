"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { api, errorMessage } from "@/lib/api/client";
import { formatDateTime } from "@/lib/utils";
import type { MediaRecord } from "@/types/admin-catalog";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Full URL to paste elsewhere (uploads are served from this origin under /uploads). */
export async function copyMediaUrl(url: string) {
  const full = /^https?:\/\//.test(url) ? url : `${window.location.origin}${url}`;
  try {
    await navigator.clipboard.writeText(full);
    toast.success("Image URL copied");
  } catch {
    toast.error("Could not copy — your browser blocked clipboard access");
  }
}

/** Preview + file info + alt text editor for one media item. */
export function MediaDetails({ item, onClose, onSaved, onDelete }: { item: MediaRecord | null; onClose: () => void; onSaved: () => void; onDelete: (item: MediaRecord) => void }) {
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) setAlt(item.alt ?? "");
  }, [item]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    try {
      await api.patch(`/admin/media/${item.id}`, { alt: alt.trim() || null });
      toast.success("Alt text saved");
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      size="lg"
      title="Image details"
      footer={
        item && (
          <>
            <Button variant="ghost" className="mr-auto text-sale" onClick={() => onDelete(item)}>
              <Trash2 className="size-4" /> Delete
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" form="media-form" loading={saving}>Save</Button>
          </>
        )
      }
    >
      {item && (
        <form id="media-form" onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <div className="flex items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt ?? ""} className="max-h-80 w-full object-contain" />
          </div>
          <div className="space-y-4">
            <Field label="Alt text" hint="Describe the image for Google and screen readers, e.g. “Black oversized tee, back print”.">
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} autoFocus />
            </Field>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">File</dt>
              <dd className="truncate font-mono text-xs leading-5" title={item.filename}>{item.filename}</dd>
              <dt className="text-muted-foreground">Folder</dt>
              <dd className="capitalize">{item.folder}</dd>
              <dt className="text-muted-foreground">Size</dt>
              <dd>
                {formatBytes(item.size)}
                {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
              </dd>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{item.mimeType}</dd>
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd>{formatDateTime(item.createdAt)}</dd>
            </dl>
            <Button variant="outline" size="sm" onClick={() => copyMediaUrl(item.url)}>
              <Copy className="size-3.5" /> Copy URL
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
