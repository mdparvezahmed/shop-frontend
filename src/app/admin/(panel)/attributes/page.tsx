"use client";

import { PageHeader } from "@/components/admin/page-header";
import { ColorsCard, SizesCard } from "@/components/admin/catalog/attribute-panels";

/** Sizes & colours — the building blocks of product variants. */
export default function AttributesPage() {
  return (
    <>
      <PageHeader title="Sizes & colours" description="Create these once, then pick them on any product to generate its variants." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SizesCard />
        <ColorsCard />
      </div>
    </>
  );
}
