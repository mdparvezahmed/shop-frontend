"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, errorMessage } from "@/lib/api/client";
import type { AdminProduct } from "@/types/admin-catalog";

/** Header actions on the edit page: view on store, duplicate, delete. */
export function ProductActions({ product, onArchived }: { product: AdminProduct; onArchived: () => void }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<"duplicate" | "delete" | null>(null);

  const duplicate = async () => {
    setBusy("duplicate");
    try {
      const copy = await api.post<AdminProduct>(`/admin/products/${product.id}/duplicate`);
      toast.success("Copy created as a draft — stock starts at 0");
      router.push(`/admin/products/${copy.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      const { archived } = await api.delete<{ archived: boolean }>(`/admin/products/${product.id}`);
      setConfirm(false);
      if (archived) {
        toast.success("This product has orders, so it was archived instead of deleted");
        onArchived();
      } else {
        toast.success("Product deleted");
        router.push("/admin/products");
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {/* Opens in a new tab. Only Active products are visible on the store, so drafts would 404. */}
      <a
        href={`/products/${product.slug}`}
        target="_blank"
        rel="noreferrer"
        className={buttonClass("outline", "md", product.status !== "ACTIVE" ? "pointer-events-none opacity-50" : undefined)}
        aria-disabled={product.status !== "ACTIVE"}
        title={product.status !== "ACTIVE" ? "Set the status to Active to see it on the store" : undefined}
      >
        <ExternalLink className="size-4" /> View on store
      </a>
      <Button variant="outline" onClick={duplicate} loading={busy === "duplicate"}>
        <Copy className="size-4" /> Duplicate
      </Button>
      <Button variant="outline" onClick={() => setConfirm(true)} className="text-sale">
        <Trash2 className="size-4" /> Delete
      </Button>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        loading={busy === "delete"}
        title={`Delete ${product.name}?`}
        message="This cannot be undone. If the product has been ordered before it will be archived instead, so your order history stays complete."
      />
    </>
  );
}
