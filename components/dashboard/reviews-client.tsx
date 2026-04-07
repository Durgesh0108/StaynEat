"use client";

import { useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Star, Trash2, CheckCircle, MessageSquare, Flag } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  ownerReply: string | null;
  isApproved: boolean;
  guestName: string;
  createdAt: Date;
}

export function ReviewsClient({ reviews: initial, businessId }: { reviews: Review[]; businessId: string }) {
  const [reviews, setReviews] = useState(initial);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  void businessId; // used for context

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rev) => rev.rating === r).length,
  }));
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    setLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast.success("Review deleted");
      }
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setLoading(null);
    }
  };

  const submitReply = async (id: string) => {
    const reply = replyText[id]?.trim();
    if (!reply) return;
    setLoading(`reply-${id}`);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerReply: reply }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ownerReply: reply } : r));
        setReplyText((prev) => ({ ...prev, [id]: "" }));
        toast.success("Reply posted");
      }
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setLoading(null);
    }
  };

  const toggleApprove = async (id: string, isApproved: boolean) => {
    setLoading(`approve-${id}`);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !isApproved }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isApproved: !isApproved } : r));
      }
    } catch {
      toast.error("Failed to update review");
    } finally {
      setLoading(null);
    }
  };

  const StarDisplay = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} ${
            s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</p>
              <StarDisplay rating={Math.round(avgRating)} size="lg" />
              <p className="text-xs text-gray-500 mt-1">{reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingCounts.map(({ rating, count }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-3">{rating}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full transition-all"
                      style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-4">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="card p-10 text-center">
          <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary-600">
                      {review.guestName[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{review.guestName}</p>
                      {review.isApproved && (
                        <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={review.rating} />
                      <span className="text-xs text-gray-400">{format(new Date(review.createdAt), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleApprove(review.id, review.isApproved)}
                    disabled={loading === `approve-${review.id}`}
                    title={review.isApproved ? "Unapprove" : "Approve"}
                    className={`transition-colors ${review.isApproved ? "text-success-500" : "text-gray-400 hover:text-success-500"}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    disabled={loading === `delete-${review.id}`}
                    className="text-gray-400 hover:text-danger-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!review.isApproved && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Flag className="h-3 w-3" /> Pending approval — not visible publicly
                </div>
              )}

              {review.comment && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
              )}

              {review.ownerReply && (
                <div className="pl-4 border-l-2 border-primary-200 dark:border-primary-800">
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">Your reply</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{review.ownerReply}</p>
                </div>
              )}

              {!review.ownerReply && (
                <div className="flex gap-2">
                  <input
                    value={replyText[review.id] ?? ""}
                    onChange={(e) => setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                    placeholder="Reply to this review..."
                    className="input text-sm flex-1"
                    onKeyDown={(e) => e.key === "Enter" && submitReply(review.id)}
                  />
                  <button
                    onClick={() => submitReply(review.id)}
                    disabled={loading === `reply-${review.id}` || !replyText[review.id]?.trim()}
                    className="btn-primary text-xs px-3 flex items-center gap-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
