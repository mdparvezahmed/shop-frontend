"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { BadgeCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { Pagination, RatingStars } from "@/components/ui/misc";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { cn, formatDate } from "@/lib/utils";
import { catalogApi } from "@/services/shop";

/** Review summary, list and "write a review" form. */
export function ProductReviews({ productId, average, count }: { productId: string; average: number; count: number }) {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { data } = useSWR(["reviews", productId, page], () => catalogApi.reviews(productId, page), { keepPreviousData: true });
  const stars = data?.stars ?? {};
  const total = Object.values(stars).reduce((a, b) => a + b, 0) || count;

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <h2 className="text-2xl font-semibold">Customer reviews</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-4xl font-semibold">{count ? average.toFixed(1) : "–"}</span>
            <div>
              <RatingStars value={average} size={16} />
              <p className="mt-1 text-xs text-muted-foreground">Based on {count} reviews</p>
            </div>
          </div>
          <div className="mt-5 space-y-1.5">
            {[5, 4, 3, 2, 1].map((r) => {
              const n = stars[r] ?? 0;
              return (
                <div key={r} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{r}</span>
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: total ? `${(n / total) * 100}%` : 0 }} />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{n}</span>
                </div>
              );
            })}
          </div>
          <Button variant="outline" className="mt-6 w-full" onClick={() => setOpen(true)}>Write a review</Button>
        </div>

        <div>
          {data?.items.length ? (
            <ul className="divide-y">
              {data.items.map((r) => (
                <li key={r.id} className="py-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <RatingStars value={r.rating} />
                    {r.title && <p className="text-sm font-semibold">{r.title}</p>}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{r.name}</span>
                    {r.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-success"><BadgeCheck className="size-3.5" /> Verified purchase</span>
                    )}
                    <span>· {formatDate(r.createdAt)}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
          )}
          {data && data.meta.totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>
      <ReviewForm productId={productId} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function ReviewForm({ productId, open, onClose }: { productId: string; open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ name: "", title: "", comment: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await catalogApi.submitReview({ productId, rating, title: form.title || undefined, comment: form.comment, name: user ? undefined : form.name });
      toast.success(res.message);
      setForm({ name: "", title: "", comment: "" });
      setRating(0);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Write a review" description="Reviews appear after a quick check by our team.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your rating" required error={errors.rating}>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button type="button" key={i} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} stars`}>
                <Star className={cn("size-8 transition", i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-border")} />
              </button>
            ))}
          </div>
        </Field>
        {!user && (
          <Field label="Your name" required error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
        )}
        <Field label="Title" error={errors.title}>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Great fit, soft fabric" />
        </Field>
        <Field label="Review" required error={errors.comment}>
          <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="How was the fabric, fit and delivery?" />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!rating}>Submit review</Button>
      </form>
    </Modal>
  );
}
