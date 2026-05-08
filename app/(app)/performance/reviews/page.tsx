"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { Star } from "lucide-react";
import { hrData, PerformanceReview } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.performance.reviews().then(data => {
      setReviews(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader title="Đánh giá nhân viên" subtitle="Feedback 360°, lịch 1:1, xếp hạng" icon={Star} />
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Đang tải lịch sử đánh giá...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Chưa có đánh giá hiệu suất nào.</p>
        ) : (
          reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                  <p className="font-bold text-slate-900">{r.period}</p>
                  <p className="text-xs text-slate-500">Người đánh giá: {r.reviewer}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.score > 0 && <span className="text-lg font-extrabold text-brand-700">{r.score}/5</span>}
                  <StatusBadge tone={r.status === "Hoàn tất" ? "green" : "gray"}>{r.status}</StatusBadge>
                </div>
              </div>
              {r.feedback && <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{r.feedback}</p>}
            </Card>
          ))
        )}
      </div>
    </>
  );
}
