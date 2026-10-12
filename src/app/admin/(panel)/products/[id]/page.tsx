"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { PackageX } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ProductActions } from "@/components/admin/catalog/product-actions";
import { ProductForm } from "@/components/admin/catalog/product-form";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import type { AdminProduct } from "@/types/admin-catalog";

/** Edit product — loads the product, then hands it to the shared editor. */
export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, error, isLoading, mutate } = useSWR<AdminProduct>(`/admin/products/${id}`);

  if (isLoading && !product) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-[60vh]" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        icon={<PackageX className="size-6" />}
        title="Product not found"
        description="It may have been deleted."
        action={<ButtonLink href="/admin/products">Back to products</ButtonLink>}
      />
    );
  }

  return (
    <>
      <PageHeader
        backHref="/admin/products"
        backLabel="Products"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {product.name} <StatusBadge status={product.status} />
          </span>
        }
        description={<span className="font-mono text-xs">{product.sku}</span>}
        actions={<ProductActions product={product} onArchived={() => mutate()} />}
      />
      {/* key: re-create the editor when another product (e.g. a duplicate) or an archived version loads */}
      <ProductForm key={`${product.id}-${product.status}`} product={product} onSaved={(saved) => mutate(saved, { revalidate: false })} />
    </>
  );
}
