import { Star } from "lucide-react";
import { Review } from "@/types";
import { formatDate } from "@/utils/formatDate";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold text-sm">
            {review.guestName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900 dark:text-white">{review.guestName}</p>
            <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-gray-700"}`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</p>
      )}
      {review.ownerReply && (
        <div className="mt-3 ml-4 pl-3 border-l-2 border-primary-200 dark:border-primary-800">
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">Owner's Reply</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{review.ownerReply}</p>
        </div>
      )}
    </div>
  );
}
