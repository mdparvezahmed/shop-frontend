"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/catalog/product-form";

/** Add product — the shared editor in "create" mode; opens the edit page after saving. */
export default function NewProductPage() {
  const router = useRouter();
  return (
    <>
      <PageHeader title="Add product" description="Fill in as much as you can — detailed products sell and rank better." backHref="/admin/products" backLabel="Products" />
      <ProductForm onSaved={(p) => router.replace(`/admin/products/${p.id}`)} />
    </>
  );
}
