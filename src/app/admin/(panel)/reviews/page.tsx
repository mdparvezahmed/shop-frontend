"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BadgeCheck, Check, ExternalLink, MessageSquareText, Trash2, X } from "lucide-react";
import { FilterTabs, ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Pagination, RatingStars, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type { AdminReview, ReviewStatus } from "@/types/admin-catalog";

/**
 * Reviews — new reviews wait in "Pending" until approved. Only approved reviews
 * show on the store and count towards a product's rating.
 */
export default function ReviewsPage() {
  const list = useAdminList<AdminReview>("/admin/reviews", { status: "PENDING", q: "" });
  const [working, setWorking] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const [busy, setBusy] = useState(false);

  const moderate = async (review: AdminReview, status: ReviewStatus) => {
    setWorking(review.id);
    try {
      await api.patch(`/admin/reviews/${review.id}`, { status });
      toast.success(status === "APPROVED" ? "Review approved — now visible on the store" : status === "REJECTED" ? "Review rejected" : "Moved back to pending");
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setWorking(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/reviews/${deleting.id}`);
      toast.success("Review deleted");
      setDeleting(null);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const status = (list.filters.status as ReviewStatus | "") ?? "";

  return (
    <>
      <PageHeader title="Reviews" description="Approve genuine reviews to build trust. Rejected reviews stay hidden." />

      <FilterTabs<ReviewStatus>
        value={status}
        onChange={(v) => list.setFilter("status", v)}
        options={[
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
          { value: "", label: "All" },
        ]}
      />
      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => list.setFilter("q", q)} placeholder="Search comment, name or product…" />

      {list.isLoading && !list.items ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : !list.items?.length ? (
        <Card>
          <EmptyState
            icon={<MessageSquareText className="size-6" />}
            title={status === "PENDING" ? "No reviews waiting" : "No reviews found"}
            description={status === "PENDING" ? "You're all caught up. New reviews will appear here." : undefined}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.items.map((r) => (
            <li key={r.id}>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingStars value={r.rating} size={16} />
                      <StatusBadge status={r.status} />
                      {r.isVerifiedPurchase && (
                        <Badge tone="success">
                          <BadgeCheck className="size-3.5" /> Verified purchase
                        </Badge>
                      )}
                    </div>
                    {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{r.comment}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{r.name}</span>
                      <span>{formatDate(r.createdAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        on
                        <Link href={`/admin/products/${r.product.id}`} className="font-medium text-foreground hover:underline">
                          {r.product.name}
                        </Link>
                        <a href={`/products/${r.product.slug}`} target="_blank" rel="noreferrer" className="hover:text-foreground" aria-label="View product on store" title="View on store">
                          <ExternalLink className="size-3" />
                        </a>
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {r.status !== "APPROVED" && (
                      <Button size="sm" onClick={() => moderate(r, "APPROVED")} loading={working === r.id} disabled={!!working}>
                        {working !== r.id && <Check className="size-3.5" />} Approve
                      </Button>
                    )}
                    {r.status !== "REJECTED" && (
                      <Button size="sm" variant="outline" onClick={() => moderate(r, "REJECTED")} disabled={!!working}>
                        <X className="size-3.5" /> Reject
                      </Button>
                    )}
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(r)} aria-label="Delete" title="Delete">
                      <Trash2 className="size-4 text-sale" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {list.meta && list.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={list.meta.page} totalPages={list.meta.totalPages} onChange={list.setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this review?"
        message="It will be removed permanently and the product rating recalculated. To just hide it, reject it instead."
      />
    </>
  );
}
