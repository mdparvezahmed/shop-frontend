"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { PageHeader } from "@/components/admin/page-header";
import { PageEditor } from "@/components/admin/operations/page-editor";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { errorMessage } from "@/lib/api/client";
import type { CmsPage } from "@/types/admin-operations";

/** Edit a content page. */
export default function EditPagePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, mutate } = useSWR<CmsPage>(`/admin/pages/${id}`, { revalidateOnFocus: false });

  if (error && !data) {
    return (
      <>
        <PageHeader title="Page" backHref="/admin/pages" backLabel="All pages" />
        <EmptyState title="Page not found" description={errorMessage(error)} />
      </>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-[480px] rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }
  return <PageEditor page={data} onSaved={(p) => mutate(p, { revalidate: false })} />;
}
